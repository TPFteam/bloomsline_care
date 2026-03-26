'use client'

import { ArrowLeft, Globe, ArrowRight, Smartphone, Monitor, Brain, Send, Sparkles, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function ProductPage() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dataroom" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dataroom
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

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Title */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Product</h1>
          <p className="text-gray-500 text-lg">What we built, how it works, where we&apos;re going — and the logic behind every decision.</p>
        </div>

        {/* ============================================ */}
        {/* 1. THE CORE LOOP */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">1. How it works</h2>
          </div>
          <p className="text-sm text-gray-500 mb-8">One cycle per week. Each one better than the last. This is the entire product in 5 steps.</p>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-6 md:left-8 top-8 bottom-8 w-px bg-gradient-to-b from-teal-300 via-violet-300 via-amber-300 to-teal-300" />

            {/* Step 1 */}
            <div className="relative flex gap-5 md:gap-7 mb-2">
              <div className="relative z-[1] w-12 md:w-16 flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Monitor className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">SESSION DAY</span>
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Practitioner dashboard</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Practitioner sees the patient</p>
                <p className="text-xs text-gray-500">Takes notes. Identifies what to work on between now and the next session.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-5 md:gap-7 mb-2">
              <div className="relative z-[1] w-12 md:w-16 flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                  <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">AFTER SESSION</span>
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Resource builder</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Shares an exercise or resource</p>
                <p className="text-xs text-gray-500">One tap. The patient gets it on their phone with a branded email: &quot;Dr. Martin shared something with you.&quot;</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-5 md:gap-7 mb-2">
              <div className="relative z-[1] w-12 md:w-16 flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">BETWEEN SESSIONS</span>
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Patient mobile app</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Patient engages at home</p>
                <p className="text-xs text-gray-500">Completes the exercise. Logs how they feel. Writes in their journal. The work continues outside the office.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex gap-5 md:gap-7 mb-2">
              <div className="relative z-[1] w-12 md:w-16 flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">BEFORE NEXT SESSION</span>
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">Bloom AI</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">AI prepares a brief</p>
                <p className="text-xs text-gray-500">Key themes, emotional patterns, what the patient completed. The practitioner walks in prepared, not scrambling.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative flex gap-5 md:gap-7">
              <div className="relative z-[1] w-12 md:w-16 flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-5 flex-1">
                <span className="text-[11px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded">NEXT SESSION</span>
                <p className="text-sm font-semibold text-white mt-2 mb-1">Better session. Richer data. Repeat.</p>
                <p className="text-xs text-gray-400">More engagement → more data → even better preparation. Each week compounds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. WHAT EXISTS */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">2. What&apos;s live today</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Shipping since January 2025. In production with real practitioners and real patients.</p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Practitioner side */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-teal-600" />
                <h3 className="font-semibold text-gray-900 text-sm">For the practitioner</h3>
                <span className="text-[10px] text-gray-400 ml-auto">Web dashboard</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Patient management</p>
                    <p className="text-[11px] text-gray-400">Info is scattered across notebooks, Drive, and memory — one place fixes that</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Resource builder & sharing</p>
                    <p className="text-[11px] text-gray-400">No way to give patients structured work between sessions — now there is</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Progress tracking</p>
                    <p className="text-[11px] text-gray-400">Hard to see if someone is improving over months — milestones and trends make it visible</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Bloom AI</p>
                    <p className="text-[11px] text-gray-400">Monday morning: &quot;remind me where we left off&quot; — AI prepares a brief so they walk in ready</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Calendar sync</p>
                    <p className="text-[11px] text-gray-400">Calendar in one place, patient records in another — we tie them together</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Patient side */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-4 h-4 text-violet-600" />
                <h3 className="font-semibold text-gray-900 text-sm">For the patient</h3>
                <span className="text-[10px] text-gray-400 ml-auto">iOS & Android</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Shared resources</p>
                    <p className="text-[11px] text-gray-400">Homework gets forgotten leaving the office — it arrives on their phone instead</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Moments capture</p>
                    <p className="text-[11px] text-gray-400">Patients can&apos;t remember how they felt by next session — logging in the moment preserves it</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Stories (journal)</p>
                    <p className="text-[11px] text-gray-400">Blank pages are overwhelming — structured blocks make it easy to start writing</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-800 font-medium">Bloom Chat (AI)</p>
                    <p className="text-[11px] text-gray-400">Between sessions, patients have no one to process with — a safe companion that reflects, never advises</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">The key:</span> these two sides are connected. What the patient does at home feeds into what the practitioner sees before the next session. Most tools serve one side. We serve the relationship.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. STRATEGIC ROADMAP */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">3. Where we&apos;re going</h2>
          </div>
          <p className="text-sm text-gray-500 mb-8">Milestone-driven, not calendar-driven. We don&apos;t move to the next phase until the current goal is hit.</p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-300 via-blue-300 via-purple-300 to-gray-400" />

            {/* Phase 1 */}
            <div className="relative flex gap-5 mb-8">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">Prove it sticks</h3>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">WE ARE HERE</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">Now → 10 active practitioners</p>

                <div className="bg-white rounded-xl border-2 border-emerald-200 p-5">
                  <p className="text-sm text-gray-700 mb-4">The product is built. The only question: <span className="font-semibold">do practitioners come back week after week?</span></p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Polish, don&apos;t expand.</span> Fix what&apos;s friction. Improve what&apos;s working. Every change driven by what we see practitioners actually do.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Focus on onboarding and listening.</span> Set it up for them. Watch where they get stuck. Fix those things.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Measure one thing:</span> how many practitioners logged in this week.</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-800"><span className="font-semibold">Success looks like:</span> 10 practitioners who use Bloomsline every week without us reminding them.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative flex gap-5 mb-8">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">Become the only tool they need</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">10 → 50 practitioners</p>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-700 mb-4">Right now, practitioners still need a second tool for some things. Every feature here closes one of those gaps — so Bloomsline becomes the single place they work from.</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Template library.</span> New practitioners should share something useful on day 1, not build from scratch for a week.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Billing & invoicing.</span> Every French practitioner generates invoices. If billing lives outside Bloomsline, the &quot;one place&quot; promise breaks.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Therapeutic messaging.</span> Patients text practitioners on WhatsApp — no boundaries, no record. We bring that conversation inside the system.</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-800"><span className="font-semibold">The logic:</span> switching cost becomes real. Their templates, invoices, message history — all inside Bloomsline. Leaving means rebuilding everything.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="relative flex gap-5 mb-8">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">Become irreplaceable</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">50 → 200 practitioners</p>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm text-gray-700 mb-4">Features that no competitor can replicate — not because of code, but because of data. Each one requires months of accumulated patient context to work.</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Outcome measures.</span> Standardized scales that prove therapy is working — practitioners can show progress to patients, referrers, and institutions.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Human analytics.</span> Patterns across weeks and months surfaced automatically — &quot;this patient has been declining for 3 weeks&quot; before it becomes a crisis. No competitor has this data.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600"><span className="font-semibold text-gray-800">Patient experience.</span> When patients genuinely want to open the app, they tell their friends&apos; therapists about it. That turns patient satisfaction into practitioner acquisition — growth without marketing spend.</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-800"><span className="font-semibold">The logic:</span> growth flips from push to pull. Practitioners join because their patients ask for it. &quot;My therapist friend uses this app — can you use it too?&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="relative flex gap-5">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-900/20">
                  <span className="text-sm font-bold text-white">4</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-lg">Become infrastructure</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">200+ practitioners</p>

                <div className="bg-gray-900 rounded-xl p-5">
                  <p className="text-sm text-gray-400">Bloomsline plugs into existing healthcare tools — Doctolib, hospital systems, insurance platforms — and expands to multi-practitioner clinics. The question shifts from &quot;should I use this?&quot; to &quot;can we integrate this?&quot;</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. BLOOM CONTEXT SYSTEM */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">4. The engine underneath</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Why the roadmap above compounds — and why a competitor can&apos;t just copy what we build.</p>

          <div className="bg-gray-900 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Bloom Context System</h3>
                <p className="text-xs text-gray-500">The foundation layer</p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-6">Every AI feature is only as good as the context behind it. BSC is the layer that turns isolated data points — a note here, an exercise there, an emotion logged at 2am — into a continuous understanding of each patient that gets sharper every week.</p>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0">
                    <p className="text-lg font-bold text-teal-400">Week 1</p>
                    <p className="text-[10px] text-gray-500">Basic summaries</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-center flex-shrink-0">
                    <p className="text-lg font-bold text-teal-400">Month 3</p>
                    <p className="text-[10px] text-gray-500">Pattern detection</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-center flex-shrink-0">
                    <p className="text-lg font-bold text-teal-400">Month 6</p>
                    <p className="text-[10px] text-gray-500">Predictive signals</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <div className="text-center flex-shrink-0">
                    <p className="text-lg font-bold text-white">Month 12+</p>
                    <p className="text-[10px] text-gray-500">Irreplaceable</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm font-semibold text-teal-400 mb-2">It connects what humans miss</p>
                  <p className="text-xs text-gray-400">Session 1 connects to session 20. &quot;Sleep issues came up in sessions 3, 7, and 14&quot; — a thread buried in months of notes, surfaced automatically.</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm font-semibold text-teal-400 mb-2">It gets smarter, not just bigger</p>
                  <p className="text-xs text-gray-400">More data doesn&apos;t just mean more storage. It means better predictions, earlier warnings, and richer briefs. The value of the system increases with every week of use.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-white">Why this matters:</span> a competitor can rebuild our interface in a few months. They cannot rebuild 6 months of accumulated patient context. Every week a practitioner uses Bloomsline, the system knows their patients better — and that&apos;s not something you switch away from.
              </p>
            </div>
          </div>
        </section>

        {/* Tech footer */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Built with</p>
            <Link href="/tech-overview" className="text-xs text-teal-600 hover:text-teal-800 underline">Full technical overview →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'Next.js', 'React', 'TypeScript', 'Supabase', 'React Native',
              'Anthropic Claude', 'PostHog', 'Postmark', 'Google Calendar API',
            ].map((tech) => (
              <span key={tech} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">{tech}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">GDPR-compliant. Data hosted in EU. Row-level security. Rate-limited AI endpoints.</p>
        </section>
      </div>
    </div>
  )
}

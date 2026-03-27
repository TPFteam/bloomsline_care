'use client'

import { ArrowLeft, Globe, ArrowRight, CheckCircle, Users, Shield, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function WhatWeNeedPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">What We Need</h1>
          <p className="text-gray-500 text-lg">Where we are, where every euro goes, and why.</p>
        </div>

        {/* ============================================ */}
        {/* 1. WHERE WE ARE */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. Where we are</h2>
          <p className="text-sm text-gray-500 mb-6">March 2026.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">€0</p>
              <p className="text-xs text-gray-500 mt-1">Revenue</p>
              <p className="text-[10px] text-gray-400 mt-2">11 demos done. 5 onboarding. Nobody has paid yet.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-500 mt-1">Practitioners onboarding</p>
              <p className="text-[10px] text-gray-400 mt-2">Real patients, real sessions. Not demo data.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-500 mt-1">Founders</p>
              <p className="text-[10px] text-gray-400 mt-2">One builds everything. The other sells everything.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">~€2</p>
              <p className="text-xs text-gray-500 mt-1">Cost per user/month</p>
              <p className="text-[10px] text-gray-400 mt-2">API + hosting. Burn rate is near zero.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">The honest read:</span> the product is live, the loop works, practitioners who see it get it immediately. What we haven&apos;t done yet is turn &quot;I&apos;d use this&quot; into &quot;I&apos;m paying for this.&quot; That&apos;s the gap this raise closes.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. DAY ONE FOCUS */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. What we focus on from day one</h2>
          <p className="text-sm text-gray-500 mb-6">Four operating principles. Each one makes us faster, stronger, or cheaper.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Automate everything that isn&apos;t human</h3>
              <p className="text-xs text-gray-600 mb-3">Onboarding emails, trial reminders, usage alerts, CRM workflows, invoice generation — automated from day one. Two people operating like ten.</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Reduces cost</span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">10x team output</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Practitioners sell for us</h3>
              <p className="text-xs text-gray-600 mb-3">Co-build with early users — they shape the product, so they advocate for it. Patients who love the app ask their own therapists to use it.</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">€0 acquisition cost</span>
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Compounding growth</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">PR and branding for trust</h3>
              <p className="text-xs text-gray-600 mb-3">Press, conferences, clinical advisor. A tool nobody has heard of is a tool nobody trusts with patient data. Visibility shortens the sales cycle.</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Faster conversion</span>
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Stronger brand</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">User feedback loop</h3>
              <p className="text-xs text-gray-600 mb-3">Weekly check-ins. What practitioners struggle with on Monday, we ship on Friday. Nothing gets built on assumption.</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Faster iteration</span>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Zero wasted dev time</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. THE ASK — DETAILED BREAKDOWN */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. The raise</h2>
          <p className="text-sm text-gray-500 mb-6">€350K–€450K pre-seed. 18 months of runway. Goal: 50 paying practitioners.</p>

          {/* Why this range */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-2">Why €350K–€450K and not less?</p>
            <p className="text-xs text-gray-600">We handle sensitive mental health data in a regulated market. Cutting corners on security, compliance, or legal isn&apos;t an option — one breach or regulatory issue is existential. The lower end (€350K) gives us 18 months with tight execution. The upper end (€450K) adds a buffer for HDS certification delays, unexpected legal costs, and runway extension if conversion takes longer than planned. Below €300K, we&apos;d have to choose between a tech lead and compliance — and in healthtech, that&apos;s not a choice.</p>
          </div>

          {/* Line-by-line breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Line item</div>
                <div className="col-span-3">Annual cost</div>
                <div className="col-span-2">18 months</div>
                <div className="col-span-3">Why it&apos;s non-negotiable</div>
              </div>
            </div>

            {/* Product & Engineering */}
            <div className="px-5 py-2 bg-teal-50/50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Product & Engineering — ~40%</p>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Tech Lead</p>
                  <p className="text-[10px] text-gray-400">Equity + salary</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€75–90K <span className="text-[10px] text-gray-400">(incl. charges)</span></p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€112–135K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">1 founder building everything breaks at 20+ users. Architecture, code quality, CI/CD.</p></div>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Infrastructure</p>
                  <p className="text-[10px] text-gray-400">API, hosting, tools</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€8–12K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€12–18K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Claude API, Supabase, PostHog, Postmark. Scales with users — ~€2/user/mo.</p></div>
              </div>
            </div>

            {/* Go-to-Market */}
            <div className="px-5 py-2 bg-blue-50/50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Go-to-Market — ~30%</p>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Practitioner Success</p>
                  <p className="text-[10px] text-gray-400">From month 4 · Equity or per-user</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€40–50K <span className="text-[10px] text-gray-400">(incl. charges)</span></p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€45–60K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Onboarding, retention, feedback. The reason practitioners stay or leave.</p></div>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">GTM activities</p>
                  <p className="text-[10px] text-gray-400">Conferences, travel, content</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€10–15K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€15–22K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">AFTCC congress booth, community events, content creation. No paid ads.</p></div>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Clinical Advisor</p>
                  <p className="text-[10px] text-gray-400">Founding team · Equity + stipend</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€10–15K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€15–22K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Product validation from inside. The face practitioners trust. Not a consultant.</p></div>
              </div>
            </div>

            {/* Trust & Compliance */}
            <div className="px-5 py-2 bg-purple-50/50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Trust & Compliance — ~20%</p>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">HDS Certification</p>
                  <p className="text-[10px] text-gray-400">One-time · Required for health data</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">One-time</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€15–25K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Hébergeur de Données de Santé. Legally required for hosting patient data in France. Without it, we can&apos;t scale.</p></div>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Security consultant</p>
                  <p className="text-[10px] text-gray-400">Retainer · GDPR, pen testing</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€15–20K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€22–30K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">GDPR hardening, penetration testing, security audits, incident response planning.</p></div>
              </div>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Legal counsel</p>
                  <p className="text-[10px] text-gray-400">Retainer · Healthtech specialist</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€12–18K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€18–27K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Data processing agreements, AI disclaimers, practitioner contracts, regulatory navigation.</p></div>
              </div>
            </div>

            {/* Operations */}
            <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Operations & Buffer — ~10%</p>
            </div>
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Accounting / bookkeeping</p>
                  <p className="text-[10px] text-gray-400">Freelance or firm</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">€6–8K</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€9–12K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">Stripe reconciliation, VAT, financial reporting. Clean books from day one.</p></div>
              </div>
            </div>
            <div className="px-5 py-3">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <p className="text-xs font-medium text-gray-800">Buffer</p>
                  <p className="text-[10px] text-gray-400">Unexpected costs, runway extension</p>
                </div>
                <div className="col-span-3"><p className="text-xs text-gray-600">—</p></div>
                <div className="col-span-2"><p className="text-xs font-semibold text-gray-800">€30–50K</p></div>
                <div className="col-span-3"><p className="text-[10px] text-gray-500">HDS delays, legal surprises, conversion taking longer than planned. In healthtech, surprises are expensive.</p></div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-900 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Total 18-month need</p>
              <p className="text-xl font-bold text-white">€350K – €450K</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                <p className="text-lg font-bold text-teal-400">~40%</p>
                <p className="text-[10px] text-gray-400">Product</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                <p className="text-lg font-bold text-blue-400">~30%</p>
                <p className="text-[10px] text-gray-400">Go-to-market</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                <p className="text-lg font-bold text-purple-400">~20%</p>
                <p className="text-[10px] text-gray-400">Trust & compliance</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                <p className="text-lg font-bold text-gray-400">~10%</p>
                <p className="text-[10px] text-gray-400">Ops & buffer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-700 mb-1">What we&apos;re not spending on</p>
            <p className="text-xs text-gray-500">Office space, paid ads, international expansion, hiring ahead of need. Zero founder salary until revenue covers it. Every euro is tied to getting 50 practitioners to pay €19/month — that&apos;s €11,400 ARR. Small, but it proves the model works and sets up the seed round.</p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. KEY HIRES */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. Key hires</h2>
          <p className="text-sm text-gray-500 mb-6">Hired in sequence. Each one unlocked by hitting the previous milestone.</p>

          <div className="relative">
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-300 via-blue-300 to-purple-300" />

            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Tech Lead</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NOW</span>
                    <span className="text-[10px] text-gray-400">€75–90K/yr total cost</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Owns architecture, code quality, CI/CD. Unblocks the founder to focus on product decisions. Someone who&apos;s shipped a SaaS product and understands healthtech constraints.</p>
              </div>
            </div>

            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Clinical Advisor</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NOW</span>
                    <span className="text-[10px] text-gray-400">Equity + stipend</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">A practitioner on the founding team. Validates every feature against real clinical practice. Becomes the face practitioners trust. Not a consultant — equity, not a free account.</p>
              </div>
            </div>

            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Practitioner Success</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">MONTH 4</span>
                    <span className="text-[10px] text-gray-400">€40–50K/yr total cost</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Owns onboarding, retention, and feedback loop. Tracks who logged in and who didn&apos;t. Turns every conversation into product input. Asks happy practitioners to refer one colleague.</p>
              </div>
            </div>

            <div className="relative flex gap-5">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-sm font-bold text-white">4</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Security & Compliance</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">BEFORE SCALING</span>
                    <span className="text-[10px] text-gray-400">€15–20K/yr retainer</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">GDPR compliance, HDS certification, penetration testing, security audits. In healthtech, one breach is existential. This is the foundation that makes everything else possible.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. KEY PARTNERSHIPS */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">5. Partnerships that change everything</h2>
          <p className="text-sm text-gray-500 mb-6">Three relationships. Each one unblocks a different growth lever.</p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">3 champion practitioners</h3>
              <p className="text-xs text-gray-600 mb-3">Use it daily, tell peers unprompted.</p>
              <div className="bg-teal-50 rounded-lg p-2.5">
                <p className="text-[10px] text-teal-800"><span className="font-semibold">Unlocks:</span> organic referrals — the real sales engine.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">1 group practice</h3>
              <p className="text-xs text-gray-600 mb-3">3-5 practitioners using it together.</p>
              <div className="bg-blue-50 rounded-lg p-2.5">
                <p className="text-[10px] text-blue-800"><span className="font-semibold">Unlocks:</span> B2B pricing validation — 3x solo revenue.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">1 professional association</h3>
              <p className="text-xs text-gray-600 mb-3">SNP, AFTCC, or similar.</p>
              <div className="bg-purple-50 rounded-lg p-2.5">
                <p className="text-[10px] text-purple-800"><span className="font-semibold">Unlocks:</span> credibility + 50 qualified leads at once.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. WHAT WE'RE WATCHING */}
        {/* ============================================ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">6. What we&apos;re watching</h2>
          <p className="text-sm text-gray-500 mb-6">Three risks we&apos;re managing — not ignoring.</p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Privacy resistance</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Some practitioners refuse to put patient data on any platform.</p>
              <p className="text-[10px] text-gray-500"><span className="font-medium text-gray-700">Plan:</span> lead with features that don&apos;t require patient data. Let trust build. HDS certification makes the argument concrete.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Conversion gap</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Interest and payment are different things. Not yet proven at €19/month.</p>
              <p className="text-[10px] text-gray-500"><span className="font-medium text-gray-700">Plan:</span> 6-month founding program. Real habits before asking for money. By month 6, they depend on it or they don&apos;t.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Funded competitors</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Doctolib, Quenza, SimplePractice have money and teams.</p>
              <p className="text-[10px] text-gray-500"><span className="font-medium text-gray-700">Plan:</span> move fast on Bloom Context System. Every week of patient data makes us harder to replicate. The window is now.</p>
            </div>
          </div>
        </section>

        {/* Bottom line */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-10">
          <p className="text-xl font-bold text-white mb-4">The ask</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            €350K–€450K to go from 5 practitioners to 50 paying ones in 18 months. The product is built. The practitioners who&apos;ve seen it get it. What&apos;s missing is the team, the compliance foundation, and the time to turn validation into revenue.
          </p>
          <p className="text-sm text-gray-500">
            Every line item is justified above. We don&apos;t need this money to figure out what to build — we need it to do what we already know works, at a scale that proves the model.
          </p>
        </section>
      </div>
    </div>
  )
}

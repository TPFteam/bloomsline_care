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
          <p className="text-gray-500 text-lg">Where we are, what the raise unlocks, and where every euro goes.</p>
        </div>

        {/* ============================================ */}
        {/* 1. WHERE WE ARE */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">1. Where we are</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">March 2026 — no sugarcoating.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">€0</p>
              <p className="text-xs text-gray-500 mt-1">Revenue</p>
              <p className="text-[10px] text-gray-400 mt-2">15 demos done. Practitioners validated the idea. Nobody has paid yet.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-500 mt-1">Active practitioners</p>
              <p className="text-[10px] text-gray-400 mt-2">Using the platform with real patients. Not demo data — real sessions.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-500 mt-1">Founders</p>
              <p className="text-[10px] text-gray-400 mt-2">One builds everything. The other sells everything. No employees, no office.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-2xl font-bold text-gray-900">~€2</p>
              <p className="text-xs text-gray-500 mt-1">Cost per user/month</p>
              <p className="text-[10px] text-gray-400 mt-2">API + hosting. Burn rate is essentially zero. We have time to get this right.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">The honest read:</span> the product is live, the loop works, and practitioners who see it understand it immediately. What we haven&apos;t done yet is turn &quot;I&apos;d use this&quot; into &quot;I&apos;m paying for this.&quot; That&apos;s the gap this raise closes.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. DAY ONE FOCUS */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">2. What we focus on from day one</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Four operating principles from the first euro raised. Each one makes us faster, stronger, or cheaper.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Automate everything that isn&apos;t human</h3>
              <p className="text-xs text-gray-600 mb-3">Onboarding emails, trial reminders, usage alerts, CRM workflows, invoice generation — automated from day one. Two people operating like ten. Every manual process we eliminate is time back on product and users.</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Reduces cost</span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">10x team output</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Practitioners sell for us</h3>
              <p className="text-xs text-gray-600 mb-3">We co-build with early users — they shape the product, so they advocate for it. Patients who love the app ask their own therapists to use it. Growth comes from inside the therapeutic relationship, not from outside it.</p>
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
        {/* 3. WHAT THE RAISE UNLOCKS */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">3. What the raise unlocks</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">€250K–€400K pre-seed. 18 months of runway. One clear goal: 50 paying practitioners.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <p className="text-sm text-gray-700 mb-6">Every euro goes into three buckets. Nothing else until 50 practitioners are paying.</p>

            {/* Allocation bars */}
            <div className="space-y-6">
              {/* Bucket 1: Product */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Product & engineering</p>
                    <p className="text-xs text-gray-400">Make the product undeniable</p>
                  </div>
                  <span className="text-sm font-bold text-teal-600">~45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: '45%' }} />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Tech lead hire.</span> One founder building everything works at 2 users. It won&apos;t work at 50. Need someone who&apos;s shipped a SaaS product before.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Template library + billing.</span> The two features that close the gap between &quot;nice tool&quot; and &quot;the only tool I need.&quot;</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Bloom Context System.</span> Deepen the AI layer — better briefs, pattern detection, cross-session memory. This is what compounds.</p>
                  </div>
                </div>
              </div>

              {/* Bucket 2: Go-to-market */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Go-to-market</p>
                    <p className="text-xs text-gray-400">Get to 50 practitioners</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">~35%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '35%' }} />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Practitioner success hire.</span> Owns onboarding, retention, and feedback. The reason practitioners stay or leave. First hire after tech lead.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Community + content.</span> Practice-building content on Instagram and LinkedIn. Enter Ose ton Lib&apos; and AFTCC. Build presence where practitioners already are.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Founding member program.</span> 6 months free for the first 10. White-glove onboarding. Turn early adopters into champions who bring colleagues.</p>
                  </div>
                </div>
              </div>

              {/* Bucket 3: Trust & compliance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Trust & compliance</p>
                    <p className="text-xs text-gray-400">Earn the right to handle patient data</p>
                  </div>
                  <span className="text-sm font-bold text-purple-600">~20%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '20%' }} />
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Security & compliance.</span> GDPR hardening, HDS certification path, penetration testing. Practitioners need to trust us more than their Google Drive folder.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Legal counsel.</span> Healthtech regulatory specialist on retainer. Data processing agreements, AI disclaimer frameworks, practitioner contracts.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600"><span className="font-medium text-gray-800">Clinical advisor.</span> A practitioner on the founding team — not a consultant. Someone who stakes their reputation on this being the right tool.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">What we&apos;re not spending on:</span> office space, paid ads, international expansion, hiring ahead of need. Every euro is tied to getting 50 practitioners to pay €19/month. That&apos;s €11,400 ARR — small, but it proves the model works.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. KEY HIRES */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">4. Key hires</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Four roles. Hired in sequence — each one unlocked by hitting the previous milestone.</p>

          <div className="relative">
            <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-300 via-blue-300 to-purple-300" />

            {/* Hire 1 */}
            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Tech Lead</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NOW</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Founding team or senior hire · Equity + salary</p>
                <p className="text-xs text-gray-600">One founder building everything works at 2 users — it won&apos;t at 50. This person owns architecture, code quality, and unblocks the founder to focus on product decisions instead of debugging deployments at 2am. Someone who&apos;s shipped a SaaS product and understands healthtech constraints.</p>
              </div>
            </div>

            {/* Hire 2 */}
            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Clinical Advisor</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">NOW</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Founding team · Equity</p>
                <p className="text-xs text-gray-600">Not a consultant — a practitioner who joins the team. Validates every feature against real clinical practice, becomes the face practitioners trust, and ensures we&apos;re building the right things. Equity, not a free account.</p>
              </div>
            </div>

            {/* Hire 3 */}
            <div className="relative flex gap-5 mb-6">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Practitioner Success</h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">AFTER 10 USERS</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Founding team or freelance · Equity or per-practitioner compensation</p>
                <p className="text-xs text-gray-600">Owns everything after a practitioner says &quot;I&apos;m interested.&quot; Onboards them, checks in at week 1, follows up at week 4. Tracks who logged in and who didn&apos;t. Turns every conversation into product feedback. Asks happy practitioners to refer one colleague. This person is the reason practitioners stay or leave.</p>
              </div>
            </div>

            {/* Hire 4 */}
            <div className="relative flex gap-5">
              <div className="relative z-[1] w-10 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-sm font-bold text-white">4</span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">Security & Compliance</h3>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">BEFORE SCALING</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Specialized hire or consultant · Retainer</p>
                <p className="text-xs text-gray-600">We handle sensitive mental health data. This person owns GDPR compliance, HDS certification, penetration testing, and security audits. They write the policies that let us tell practitioners &quot;your data is safer with us than in your Google Drive folder.&quot; Not optional in healthtech.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. KEY PARTNERSHIPS */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">5. Partnerships that change everything</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Three relationships. Each one unblocks a different growth lever.</p>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h3 className="font-semibold text-gray-900 text-sm">3 champion practitioners</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Practitioners who use Bloomsline daily and tell peers without being asked. Sandra said &quot;I have WhatsApp groups with psychologists — send me something I can forward.&quot; We need 3 more like her.</p>
              <div className="bg-teal-50 rounded-lg p-2.5">
                <p className="text-[11px] text-teal-800"><span className="font-semibold">What this unlocks:</span> organic referrals. One happy practitioner telling 3 colleagues is the real sales engine for this market.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">1 group practice (cabinet)</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">A cabinet of 3-5 practitioners using the platform together. Proves the multi-seat model works and gives us our first case study with real numbers.</p>
              <div className="bg-blue-50 rounded-lg p-2.5">
                <p className="text-[11px] text-blue-800"><span className="font-semibold">What this unlocks:</span> B2B pricing validation. A cabinet paying €49 + €19/seat is 3x the revenue of a solo practitioner.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">1 professional association</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">SNP, AFTCC, or similar. A mention in their newsletter or a booth at their conference puts us in front of hundreds of qualified practitioners at once.</p>
              <div className="bg-purple-50 rounded-lg p-2.5">
                <p className="text-[11px] text-purple-800"><span className="font-semibold">What this unlocks:</span> credibility + scale. One association partnership = 50+ qualified leads. It&apos;s the fastest way to go from 10 to 50.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. WHAT WE'RE WATCHING */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">6. What we&apos;re watching</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Three risks we&apos;re actively managing — not ignoring.</p>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Privacy resistance</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Some practitioners refuse to put patient data on any platform. Patricia said &quot;Absolutely not. That&apos;s confidential. I don&apos;t even use Doctolib.&quot; This is a real segment of the market.</p>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-[11px] text-gray-700"><span className="font-semibold">How we manage it:</span> lead with features that don&apos;t require patient data (templates, resource library). Let trust build. Patient data features come after they&apos;re already invested. HDS certification makes the security argument concrete.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Conversion gap</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Everyone who sees the product says &quot;interesting&quot; — but interest and payment are different things. We haven&apos;t yet proven someone will pay €19/month.</p>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-[11px] text-gray-700"><span className="font-semibold">How we manage it:</span> 6-month founding member program. Let practitioners build real habits with real patients before asking for money. By month 6, they either depend on it or they don&apos;t — and we learn why.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Funded competitors</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">Doctolib, Quenza, SimplePractice have money, teams, and users. Our advantage — AI + UX + both sides of the therapeutic relationship — is real today but not permanent.</p>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-[11px] text-gray-700"><span className="font-semibold">How we manage it:</span> move fast on the Bloom Context System. Every week of accumulated patient data makes the product harder to replicate. The window is open now — the race is to build enough context depth before someone else tries.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom line */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-10">
          <p className="text-xl font-bold text-white mb-4">The ask</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            €250K–€400K to go from 2 practitioners to 50 paying ones. The product is built. The practitioners who&apos;ve seen it get it. What&apos;s missing is the team and the time to turn validation into revenue.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-teal-400">45%</p>
              <p className="text-xs text-gray-400 mt-1">Product & engineering</p>
              <p className="text-[10px] text-gray-500">Make it undeniable</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-blue-400">35%</p>
              <p className="text-xs text-gray-400 mt-1">Go-to-market</p>
              <p className="text-[10px] text-gray-500">Get to 50 practitioners</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-purple-400">20%</p>
              <p className="text-xs text-gray-400 mt-1">Trust & compliance</p>
              <p className="text-[10px] text-gray-500">Earn the right to scale</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

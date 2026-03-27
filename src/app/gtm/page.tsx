'use client'

import { ArrowLeft, Globe, Target, MapPin, BarChart2, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function GTMPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Go-To-Market: The Next 30 Days</h1>
          <p className="text-gray-500 text-lg">From 2 users to 10 paying practitioners. Everything else comes after.</p>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Key insight:</span> 13 practitioners saw the product and liked it. Nobody said no — we just never asked. That&apos;s our fastest path to 10.
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* 1. WHO */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Who are we going after?</h2>
              <p className="text-sm text-gray-500">Three segments, prioritized. Validated from 15 product demos.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Segment A — Primary */}
            <div className="bg-white rounded-xl border-2 border-teal-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">PRIMARY</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Young brief therapy psychologists</h3>
              <p className="text-xs text-gray-500 mb-3">CBT, ACT, EMDR. 1-10 years in practice. High patient turnover.</p>
              <ul className="space-y-1.5 mb-4">
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                  Homework between sessions is core to their method
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                  More patient names = bigger pain
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                  Findable via AFTCC directory
                </li>
              </ul>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-teal-600">~2,500</p>
                <p className="text-[10px] text-gray-400">AFTCC members, France</p>
              </div>
            </div>

            {/* Segment B — Secondary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">SECONDARY</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Young psychologists (all approaches)</h3>
              <p className="text-xs text-gray-500 mb-3">Early career, private practice. 3,500 new graduates yearly. 70% micro-entrepreneurs.</p>
              <ul className="space-y-1.5 mb-4">
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  Need structure from day one
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  Active in Ose ton Lib&apos; (9,000+)
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  Willing to pay €20/month
                </li>
              </ul>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-blue-600">~30,000</p>
                <p className="text-[10px] text-gray-400">Psychologists in private practice</p>
              </div>
            </div>

            {/* Segment C — Expansion */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">EXPANSION</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Practitioners & coaches</h3>
              <p className="text-xs text-gray-500 mb-3">Psychotherapists, sophrologues, coaches, hypnotherapists. Sophrologie doubled since 2019.</p>
              <ul className="space-y-1.5 mb-4">
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  Same pain, less regulation
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  40% under 2 years in practice
                </li>
                <li className="flex items-start gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  Higher willingness to pay
                </li>
              </ul>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-gray-900">70,000+</p>
                <p className="text-[10px] text-gray-400">Total addressable, France</p>
              </div>
            </div>
          </div>

        </section>

        {/* ============================================ */}
        {/* 2. WHERE */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">2. Where do we find them?</h2>
              <p className="text-sm text-gray-500">Channels ranked by likelihood of conversion</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Channel 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="font-semibold text-gray-900">Personalized Cold Outreach</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">Active</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">1 month in</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">Direct, one-to-one messages to practitioners found via directories, LinkedIn, and Instagram. No templates — every message is personalized to their practice, approach, and location.</p>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">~100</p>
                  <p className="text-[10px] text-gray-400">Reached out</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">25</p>
                  <p className="text-[10px] text-gray-400">Replied</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-teal-600">11</p>
                  <p className="text-[10px] text-gray-400">Demos done</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-teal-600">5</p>
                  <p className="text-[10px] text-gray-400">Onboarding</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">What&apos;s working</p>
                <p className="text-sm text-gray-600">25% reply rate on personalized messages. 44% of replies convert to demo. 45% of demos convert to onboarding. The funnel works — now it needs volume.</p>
              </div>
            </div>

            {/* Channel 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="font-semibold text-gray-900">Online Communities</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-medium">Both segments</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">Starting April</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">Practitioners gather in private communities to share advice, ask questions, and recommend tools. The trust is already built — we just need to be present and useful.</p>
              <div className="space-y-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">Ose ton Lib&apos;</p>
                  <p className="text-xs text-gray-500">9,000+ psychologists setting up in private practice. Active Slack community. 165K Instagram followers. Run by Marion.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">Facebook groups</p>
                  <p className="text-xs text-gray-500">Psychologues en libéral, Psychologues et TCC, Sophrologie professionnelle — active groups where practitioners discuss tools and workflows daily.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Join and contribute first — answer questions, share practice-building content. Build trust before mentioning the product. Propose partnerships with community leaders.</p>
              </div>
            </div>

            {/* Channel 3 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="font-semibold text-gray-900">AFTCC Directory + Congress</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">Segment B</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">Starting April</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">2,500 CBT practitioners. Public searchable directory by name and location. Annual congress (December 2025).</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Use the annuaire to find CBT practitioners in Paris/Lyon. Send 10 personalized messages per day. Apply for congress speaking/booth slot.</p>
              </div>
              <a href="https://www.aftcc.org/annuaire" target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:text-teal-800 underline mt-2 inline-block">aftcc.org/annuaire</a>
            </div>

            {/* Channel 4 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                  <h3 className="font-semibold text-gray-900">Instagram + LinkedIn Content</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">Active</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">Testing phase</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3">Currently learning what resonates. Testing content formats, hashtags, and engagement strategies on both platforms. Initial pilot results expected in 3 weeks — then shifting to a concrete targeting approach.</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Current approach</p>
                <p className="text-sm text-gray-600">Practice-building content, not product features. Engaging with practitioner accounts (@osetonlib, @encoreunepsy, @catherine_la_psy). Learning which topics and formats drive real conversations before scaling.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. THE MILESTONES */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">3. The milestones</h2>
              <p className="text-sm text-gray-500">Two targets. Everything else follows.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border-2 border-purple-200 p-6 text-center">
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">30 DAYS</span>
              <p className="text-3xl font-bold text-gray-900 mt-3 mb-1">10</p>
              <p className="text-sm text-gray-500">practitioners onboarding</p>
              <p className="text-xs text-gray-400 mt-2">Using the platform with real patients. Not demo data, not free trials — real sessions, real notes, real engagement.</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-center">
              <span className="text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-1 rounded">90 DAYS</span>
              <p className="text-3xl font-bold text-white mt-3 mb-1">50</p>
              <p className="text-sm text-gray-400">practitioners active</p>
              <p className="text-xs text-gray-500 mt-2">Logging in weekly, sharing resources, relying on Bloom AI. The product is part of their routine — not something they try once.</p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. THE OFFER */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">4. The offer that converts</h2>
              <p className="text-sm text-gray-500">What we say to turn &quot;interesting&quot; into &quot;yes&quot;</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">FIRST 10 PRACTITIONERS</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium">Limited</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">6 months completely free</p>
                  <p className="text-xs text-gray-500">No credit card. No commitment. Full Pro features from day one.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">We set it up for you</p>
                  <p className="text-xs text-gray-500">15-minute call. We import your first patients, configure your profile, show you the basics.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">Founding member status</p>
                  <p className="text-xs text-gray-500">Shape the product. Direct access to the founders. Your feedback builds the roadmap.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">Lock in the price forever</p>
                  <p className="text-xs text-gray-500">Early adopters keep the founding price — even when pricing goes up.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">EVERYONE ELSE</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">60-day free trial</p>
                  <p className="text-xs text-gray-500">Full access. No credit card required. Convert when you&apos;re ready.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">White-glove onboarding</p>
                  <p className="text-xs text-gray-500">Same personal setup call. We help you get started.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Why 6 months:</span> Long enough to go through full patient cycles. By the time they&apos;re asked to pay, they&apos;ll have 6 months of patient data — while everyone else is still on paper notebooks. That advantage compounds, and the tool becomes indispensable.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. THE ONE METRIC */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">5. How do we know it&apos;s working?</h2>
              <p className="text-sm text-gray-500">One number. Every week.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-900 p-8 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">The one metric that matters</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">Active practitioners who logged in this week</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Not signups. Not demos. Not MRR. How many practitioners actually opened Bloomsline and used it in the last 7 days. That&apos;s the only number that tells you if the product sticks.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-red-600 uppercase">Red flag</p>
              </div>
              <p className="text-sm text-gray-700">0 new active users after week 1 of warm outreach</p>
              <p className="text-xs text-gray-500 mt-1">→ The product or pitch isn&apos;t landing. Stop outreach. Talk to users. Fix.</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-amber-600 uppercase">Yellow flag</p>
              </div>
              <p className="text-sm text-gray-700">Users sign up but don&apos;t log in after week 1</p>
              <p className="text-xs text-gray-500 mt-1">→ Onboarding is broken. They said yes but never started. Fix the first 10 minutes.</p>
            </div>
            <div className="bg-white rounded-xl border border-teal-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                <p className="text-xs font-bold text-teal-600 uppercase">Green light</p>
              </div>
              <p className="text-sm text-gray-700">Someone signs up without your direct involvement</p>
              <p className="text-xs text-gray-500 mt-1">→ You have a business, not a consulting project. Double down.</p>
            </div>
          </div>
        </section>

        {/* Bottom line */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-12">
          <p className="text-xl font-bold text-white mb-4">The bottom line</p>
          <p className="text-gray-400 leading-relaxed">
            Start with the 13 who already saw the demo. Then enter the communities where your target practitioners already hang out.
            Then cold outreach to CBT practitioners via AFTCC. Check one number every Friday: how many practitioners logged in this week.
            Everything else is noise until you have 10 active users.
          </p>
        </section>
      </div>
    </div>
  )
}

'use client'

import { ArrowLeft, Globe, Target, MapPin, ArrowRight, BarChart2, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react'
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
              <p className="text-sm text-gray-500">Two segments confirmed from 15 product demos</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Segment A */}
            <div className="bg-white rounded-xl border-2 border-teal-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">SEGMENT A</span>
                <span className="text-xs text-gray-400">Primary target</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Young Psychologists</h3>
              <p className="text-sm text-gray-500 mb-4">1-5 years in practice, building their client base</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  No established system yet — no habits to break
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  Digital native, open to new tools
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  Need structure from day one
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  Active on Instagram and in communities like Ose ton Lib&apos;
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">What they said in demos</p>
                <p className="text-sm text-gray-700 italic">&quot;It&apos;s well designed. I could figure it out on my own without you explaining.&quot; — Yoann</p>
              </div>
            </div>

            {/* Segment B */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">SEGMENT B</span>
                <span className="text-xs text-gray-400">Secondary target</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Brief / CBT Therapists</h3>
              <p className="text-sm text-gray-500 mb-4">See patients for 6-8 months, high turnover</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  More names to remember = bigger pain
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  Between-session work (homework, exercises) is core to their method
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  Resources and tracking directly impact outcomes
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  Findable via AFTCC (2,500 members, public directory)
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">What they said in demos</p>
                <p className="text-sm text-gray-700 italic">&quot;The resources you share between sessions — that triggers the decision to come back.&quot; — Kevin</p>
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
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 className="font-semibold text-gray-900">Ose ton Lib&apos; Community</h3>
                </div>
                <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded font-medium">Segment A</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">9,000+ psychologists setting up in private practice. Active Slack community. 165K Instagram followers. Run by Marion.</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Reach out to Marion for partnership. Offer value first — guest content, free tool for her community. Get into the Slack. Don&apos;t pitch. Be helpful.</p>
              </div>
              <a href="https://www.osetonlib.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:text-teal-800 underline mt-2 inline-block">osetonlib.com</a>
            </div>

            {/* Channel 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 className="font-semibold text-gray-900">AFTCC Directory + Congress</h3>
                </div>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">Segment B</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">2,500 CBT practitioners. Public searchable directory by name and location. Annual congress (December 2025).</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Use the annuaire to find CBT practitioners in Paris/Lyon. Send 10 personalized messages per day. Apply for congress speaking/booth slot.</p>
              </div>
              <a href="https://www.aftcc.org/annuaire" target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:text-teal-800 underline mt-2 inline-block">aftcc.org/annuaire</a>
            </div>

            {/* Channel 3 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <h3 className="font-semibold text-gray-900">Instagram + LinkedIn Content</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-medium">Both segments</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">Young psychologists are highly active on Instagram (#psychologueliberal). LinkedIn works for professional credibility. Both are free.</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Post 3x/week. Content about practice-building, not product features. Engage on @osetonlib, @encoreunepsy, @catherine_la_psy posts. Build presence before pitching.</p>
              </div>
            </div>

            {/* Channel 4 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs font-bold">4</span>
                  <h3 className="font-semibold text-gray-900">The 13 Demo Contacts</h3>
                </div>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium">Warm leads</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">13 practitioners who saw the product and liked it but were never asked to pay. They already know you. They already saw the demo.</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Action</p>
                <p className="text-sm text-gray-600">Message each one personally: &quot;We&apos;ve been building since we last talked. The product is live. Would you be open to trying it for 60 days, free?&quot; This is the fastest path to 5 more users.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. THE SHIFT */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">3. The shift we need to make</h2>
              <p className="text-sm text-gray-500">From research mode to sales mode</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🔍</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Where we were</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">&quot;What do you think?&quot;</p>
                <p className="text-xs text-gray-500">Validating the idea. Understanding the pain. Not asking for commitment.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🤝</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Where we are</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">&quot;Would you use this?&quot;</p>
                <p className="text-xs text-gray-500">Product is live. 2 practitioners using it. Time to ask for real commitment.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">💳</span>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Where we need to be</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">&quot;Here&apos;s how to start.&quot;</p>
                <p className="text-xs text-gray-500">Not pitching. Not selling. Just making it easy to say yes.</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">The key insight:</span> Nobody said no. We just never asked. The 13 demo contacts liked the product — they were never given the chance to use it. That&apos;s our fastest path to 10 users.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. THE 30-DAY PLAN */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">4. The 30-day plan</h2>
              <p className="text-sm text-gray-500">From 2 to 10 paying practitioners</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Week 1 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">WEEK 1</span>
                <span className="text-sm font-semibold text-gray-900">Activate warm leads</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Message all 13 demo contacts personally</p>
                    <p className="text-xs text-gray-500">&quot;We&apos;ve been building since we last spoke. It&apos;s live. Would you try it for 60 days?&quot;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Book 5 setup calls</p>
                    <p className="text-xs text-gray-500">15-minute white-glove onboarding. You set it up for them. Import their first 3 patients.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Ask each new user for 1 introduction</p>
                    <p className="text-xs text-gray-500">&quot;Do you know one colleague who might find this useful?&quot; — before hanging up.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Target: 5 new active users by end of week 1</p>
              </div>
            </div>

            {/* Week 2 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">WEEK 2</span>
                <span className="text-sm font-semibold text-gray-900">Enter the communities</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Reach out to Marion (Ose ton Lib&apos;)</p>
                    <p className="text-xs text-gray-500">Propose value first: free guest content, case study, or tool for her community. Not a sales pitch.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Start Instagram content (3 posts)</p>
                    <p className="text-xs text-gray-500">Practice-building tips, not product features. Use #psychologueliberal #psychologue #santementale</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Join Facebook groups for psychologues en libéral</p>
                    <p className="text-xs text-gray-500">Observe first. Answer questions. Build trust before mentioning your product.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Target: community presence established, 2 new conversations started</p>
              </div>
            </div>

            {/* Week 3-4 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">WEEK 3-4</span>
                <span className="text-sm font-semibold text-gray-900">Cold outreach to CBT practitioners</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">AFTCC annuaire: find 50 CBT practitioners in Paris/Lyon</p>
                    <p className="text-xs text-gray-500">Use the public directory. Cross-reference with LinkedIn for contact info.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Send 10 personalized messages per day</p>
                    <p className="text-xs text-gray-500">&quot;Quick question: how do you prepare for your first session on Monday morning?&quot; — not a pitch, a conversation starter.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium">Convert conversations to 15-min demo calls</p>
                    <p className="text-xs text-gray-500">End every positive reply with: &quot;Would love to show you in 10 minutes if you&apos;re curious.&quot;</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Target: 3-5 more active users from cold outreach</p>
              </div>
            </div>
          </div>

          {/* 30-day summary */}
          <div className="mt-6 bg-gray-900 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">13</p>
                <p className="text-xs text-gray-400">warm leads to reactivate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">50</p>
                <p className="text-xs text-gray-400">cold outreach targets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-400">10</p>
                <p className="text-xs text-gray-400">active practitioners (goal)</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. THE OFFER */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">5. The offer that converts</h2>
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
              <span className="font-semibold">Why this works:</span> The first 10 get enough time to truly integrate Bloomsline into their practice. 6 months means they go through full patient cycles. By the time they&apos;re asked to pay, it&apos;s already indispensable.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. THE ONE METRIC */}
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
            The product is built. The positioning is clear. The only thing between 2 users and 10 is asking people to use it.
            Start with the 13 who already saw the demo. Then enter the communities where your target practitioners already hang out.
            Then cold outreach to CBT practitioners via AFTCC. Check one number every Friday: how many practitioners logged in this week.
            Everything else is noise until you have 10 active users.
          </p>
        </section>
      </div>
    </div>
  )
}

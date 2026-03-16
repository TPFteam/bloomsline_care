'use client'

import { useState } from 'react'

type Bg = 'light' | 'dark'

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: (bg: Bg) => React.ReactNode }) {
  const [bg, setBg] = useState<Bg>('light')
  return (
    <div className="rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className={`relative p-14 flex flex-col items-center justify-center min-h-[260px] transition-colors cursor-pointer ${bg === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'}`}
        onClick={() => setBg(bg === 'light' ? 'dark' : 'light')}
      >
        {children(bg)}
        <span className="absolute bottom-3 right-3 text-[9px] text-neutral-300">{bg === 'light' ? 'dark' : 'light'}</span>
      </div>
      <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
        <p className="text-sm font-semibold text-neutral-800 mb-0.5">{title}</p>
        <p className="text-[11px] text-neutral-400 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  )
}

const T = '#4A9A86'
const L = '#A88AE1'

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-8 py-20">
        <h1 className="text-xl font-semibold text-neutral-800 mb-1">Bloomsline — Logo Exploration</h1>
        <p className="text-xs text-neutral-400 mb-16">Applying the 5 patterns: controlled imperfection, warm signature color, lowercase spacing, one element, metaphor not literal.</p>

        {/* ════ SECTION 1: WORDMARK-ONLY ════ */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Wordmark Only — Typography IS the Logo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">

          {/* W1: The Breathing Wordmark */}
          <Card title="The Breathing Wordmark" subtitle="Ultra-wide tracking. The space between letters IS the product — the space between sessions.">{(bg) => (
            <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 350, letterSpacing: '0.18em' }}>
              bloomsline
            </span>
          )}</Card>

          {/* W2: The Soft Split */}
          <Card title="The Soft Split" subtitle="'blooms' in medium, 'line' in light. The bloom is grounded. The line is gentle. Two weights, one word.">{(bg) => (
            <div className="flex items-baseline">
              <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 460, letterSpacing: '0.03em' }}>blooms</span>
              <span className={`text-[22px] ${bg === 'dark' ? 'text-white/50' : 'text-[#111]/40'}`} style={{ fontWeight: 280, letterSpacing: '0.03em' }}>line</span>
            </div>
          )}</Card>

          {/* W3: The Teal OO */}
          <Card title="The Teal OO" subtitle="The two O's in teal — two people, two sides of care, two eyes looking at each other. Stripe's slashed letters energy.">{(bg) => (
            <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 420, letterSpacing: '0.04em' }}>
              bl<span style={{ color: T }}>oo</span>msline
            </span>
          )}</Card>

          {/* W4: The Dot */}
          <Card title="The Dot" subtitle="A small teal dot after the name. Like a period — a moment of pause. Like Headspace's imperfect circle, but quieter.">{(bg) => (
            <div className="flex items-center gap-2">
              <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
              <div className="w-2 h-2 rounded-full" style={{ background: T }} />
            </div>
          )}</Card>

          {/* W5: The Line Through */}
          <Card title="The Underscore" subtitle="A subtle teal line under 'line'. The continuous line of care — literally underscoring what matters.">{(bg) => (
            <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
              blooms<span className="relative"><span className="relative z-10">line</span><span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: T, opacity: 0.6 }} /></span>
            </span>
          )}</Card>

          {/* W6: The Fade */}
          <Card title="The Fade" subtitle="Letters gradually fade from dark to teal. The transition from struggle to growth. The bloom happening in real time.">{(bg) => (
            <div className="flex items-baseline">
              <span className={`text-[22px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>bloo</span>
              <span className="text-[22px]" style={{ fontWeight: 400, letterSpacing: '0.04em', color: bg === 'dark' ? '#7DBFAD' : '#3D8B78' }}>ms</span>
              <span className="text-[22px]" style={{ fontWeight: 400, letterSpacing: '0.04em', color: T }}>line</span>
            </div>
          )}</Card>

        </div>

        {/* ════ SECTION 2: MARK + WORDMARK ════ */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Small Mark + Wordmark — One Subtle Symbol</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">

          {/* M1: The Imperfect Dot */}
          <Card title="The Imperfect Dot" subtitle="A slightly organic, not-quite-round teal shape. Like Headspace but quieter. Perfection is unrealistic — and that's ok.">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.5 2 2 6.2 2 12C2 17.5 6.2 22 12 22C17.8 22 22 17.8 22 12C22 6 17.5 2 12 2Z" fill={T} opacity="0.85" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

          {/* M2: The Continuous Mark */}
          <Card title="The Continuous Mark" subtitle="One stroke that never lifts. An abstract 'b' that loops back into itself. Continuity of care in one gesture.">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M8 22V6C8 6 8 4 13 4C18 4 18 8 18 10C18 12 18 14 13 14C8 14 8 14 8 14" stroke={T} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M8 14C8 14 8 14 13 14C18 14 18 18 18 19C18 21 18 22 13 22C8 22 8 22 8 22" stroke={T} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 420, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

          {/* M3: The Seed Dot */}
          <Card title="The Seed Dot" subtitle="A tiny teal teardrop — a seed, a drop, a moment. Small things compound. Not a logo that demands attention, one that earns it.">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <path d="M8 2C8 2 2 8 2 13C2 17 4.5 20 8 20C11.5 20 14 17 14 13C14 8 8 2 8 2Z" fill={T} opacity="0.8" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

          {/* M4: The Two Arcs */}
          <Card title="The Two Arcs" subtitle="Two minimal strokes that almost touch. The space between them is the product. Teal and lavender — practitioner and member.">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 18C4 10 7 4 11 4" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M18 18C18 10 15 4 11 4" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

          {/* M5: The Rising Line */}
          <Card title="The Rising Line" subtitle="A single line that gently rises. Not a graph, not a chart — just a quiet upward trajectory. Growth without performance anxiety.">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
                <path d="M2 14C6 12 10 8 14 6C18 4 22 3 26 2" stroke={T} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

          {/* M6: The Open Circle */}
          <Card title="The Open Circle" subtitle="A circle that doesn't close. Not complete, not broken — in progress. An invitation, not a boundary.">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M18 7C16 3.5 13 2 10 2C5 2 2 6 2 11C2 16 5 20 10 20C14 20 17 17 18 13" stroke={T} strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className={`text-[20px] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400, letterSpacing: '0.04em' }}>
                bloomsline
              </span>
            </div>
          )}</Card>

        </div>

        {/* ════ SECTION 3: WORDMARK WEIGHTS ════ */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Typography Weight Study</h2>
        <div className="grid grid-cols-1 gap-3 mb-20">
          {[
            { weight: 300, tracking: '0.06em', label: 'Light + Wide — airy, luxury, Aesop energy' },
            { weight: 380, tracking: '0.04em', label: 'Book + Medium — balanced, Stripe energy' },
            { weight: 420, tracking: '0.03em', label: 'Regular + Tight — confident, Notion energy' },
            { weight: 500, tracking: '0.02em', label: 'Medium + Compact — grounded, strong' },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-neutral-200 px-8 py-5">
              <span className="text-[24px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>
                bloomsline
              </span>
              <span className="text-[10px] text-neutral-400">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ════ SECTION 4: APP ICONS ════ */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">App Icon Candidates</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-20">
          {[
            // Imperfect dot
            <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.5 2 2 6.2 2 12C2 17.5 6.2 22 12 22C17.8 22 22 17.8 22 12C22 6 17.5 2 12 2Z" fill={T} /></svg>,
            // Continuous b
            <svg key="2" width="24" height="28" viewBox="0 0 26 26" fill="none"><path d="M8 22V6C8 6 8 4 13 4C18 4 18 8 18 10C18 12 18 14 13 14C8 14 8 14 8 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M8 14C8 14 8 14 13 14C18 14 18 18 18 19C18 21 18 22 13 22C8 22 8 22 8 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" /></svg>,
            // Seed
            <svg key="3" width="20" height="28" viewBox="0 0 16 22" fill="none"><path d="M8 2C8 2 2 8 2 13C2 17 4.5 20 8 20C11.5 20 14 17 14 13C14 8 8 2 8 2Z" fill={T} /></svg>,
            // Two arcs
            <svg key="4" width="24" height="24" viewBox="0 0 22 22" fill="none"><path d="M4 18C4 10 7 4 11 4" stroke={T} strokeWidth="2.5" strokeLinecap="round" /><path d="M18 18C18 10 15 4 11 4" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg>,
            // Open circle
            <svg key="5" width="24" height="24" viewBox="0 0 22 22" fill="none"><path d="M18 7C16 3.5 13 2 10 2C5 2 2 6 2 11C2 16 5 20 10 20C14 20 17 17 18 13" stroke={T} strokeWidth="2.5" strokeLinecap="round" fill="none" /></svg>,
            // Just the OO
            <svg key="6" width="28" height="24" viewBox="0 0 28 20" fill="none"><circle cx="8" cy="10" r="6" stroke={T} strokeWidth="2" fill="none" /><circle cx="20" cy="10" r="6" stroke={T} strokeWidth="2" fill="none" opacity="0.5" /></svg>,
          ].map((icon, i) => (
            <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-[#111]' : 'bg-white border border-neutral-200'}`}>
              {icon}
            </div>
          ))}
        </div>

        {/* ════ RECOMMENDATION ════ */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-8">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Analysis</h3>
          <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
            <p><strong>Strongest wordmark-only:</strong> &quot;The Teal OO&quot; — the two colored letters become the brand signature. Like Stripe&apos;s slashed letters, it&apos;s a typographic detail that&apos;s uniquely yours. Two O&apos;s = two sides of care.</p>
            <p><strong>Strongest mark + wordmark:</strong> &quot;The Open Circle&quot; — a circle that doesn&apos;t close. It says &quot;we&apos;re not about completion, we&apos;re about the journey.&quot; Uniquely therapeutic. No other brand uses an intentionally incomplete circle as their mark.</p>
            <p><strong>Best weight:</strong> 380 with 0.04em tracking — the sweet spot between luxury lightness and confident readability.</p>
            <p><strong>For app icon:</strong> The Seed Dot (teardrop) — instantly recognizable at 32px, organic, unique silhouette in an app drawer full of circles and squares.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

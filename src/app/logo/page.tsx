'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

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

// Imperfect seed — not a perfect circle, slightly organic
function Seed({ color, size = 12, className, style }: { color: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className} style={style}>
      <path d="M6 1C3.5 0.8 1 3 0.8 6C0.6 9 3 11.2 6 11.4C9 11.6 11.4 9.2 11.2 6.2C11 3.2 8.5 1.2 6 1Z" fill={color} />
    </svg>
  )
}

const STORY_STEPS = [
  { bite: 0, seed: false, seedColor: T, wash: false, text: 'A complete circle. The whole you.', wordmark: false },
  { bite: 12, seed: false, seedColor: T, wash: false, text: 'An opening appears. Not a break — a door.', wordmark: false },
  { bite: 12, seed: true, seedColor: T, wash: false, text: 'A seed grows from the opening. Small. Alive.', wordmark: false },
  { bite: 12, seed: true, seedColor: T, wash: true, text: 'Care flows in. The circle begins to change.', wordmark: true },
  { bite: 12, seed: true, seedColor: L, wash: true, text: 'An insight emerges. Awareness shifts.', wordmark: true },
  { bite: 12, seed: true, seedColor: '#F59E0B', wash: true, text: 'A moment is captured. Warmth spreads.', wordmark: true },
  { bite: 12, seed: true, seedColor: '#F472B6', wash: true, text: 'Emotion arrives. Vulnerability is strength.', wordmark: true },
  { bite: 12, seed: true, seedColor: T, wash: false, text: 'A person who opened up. Something beautiful grew.', wordmark: true },
]

function StoryAnimation() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'auto' | 'manual'>('manual')

  // Auto mode
  useEffect(() => {
    if (mode !== 'auto') return
    const interval = setInterval(() => {
      setStep(s => (s + 1) % STORY_STEPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [mode])

  const s = STORY_STEPS[step]

  return (
    <div className="mt-16 mb-16">
      <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">The Story — Step by Step</h3>
      <div className="flex items-center gap-3 mb-8">
        <p className="text-[12px] text-neutral-500">Watch the logo come to life.</p>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
          <button
            onClick={() => { setMode('manual'); setStep(0) }}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${mode === 'manual' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-400'}`}
          >
            Manual
          </button>
          <button
            onClick={() => { setMode('auto'); setStep(0) }}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-colors ${mode === 'auto' ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-400'}`}
          >
            Auto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center">
        {/* Logo */}
        <div className="relative" style={{ width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 60 60" fill="none">
            <defs>
              <mask id="story-m">
                <rect width="60" height="60" fill="white" />
                <circle cx="10" cy="12" r={s.bite} fill="black" style={{ transition: 'r 0.8s ease-in-out' }} />
              </mask>
              <clipPath id="story-c"><circle cx="30" cy="30" r="26" /></clipPath>
            </defs>
            <circle cx="30" cy="30" r="26" fill="#d4d4d4" opacity={s.bite > 0 ? 0.35 : 0.5} mask="url(#story-m)" style={{ transition: 'opacity 0.8s' }} />
            {s.wash && (
              <g clipPath="url(#story-c)" mask="url(#story-m)">
                <circle cx="12" cy="14" r="55" fill={s.seedColor} opacity="0.08" style={{ transition: 'fill 0.8s' }} />
              </g>
            )}
          </svg>
          {/* Seed */}
          <div
            className="absolute"
            style={{
              left: 12, top: 12,
              transform: s.seed ? 'scale(1)' : 'scale(0)',
              opacity: s.seed ? 1 : 0,
              transition: 'transform 0.6s ease-out, opacity 0.6s',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 12 12" fill="none">
              <path d="M6 1C3.5 0.8 1 3 0.8 6C0.6 9 3 11.2 6 11.4C9 11.6 11.4 9.2 11.2 6.2C11 3.2 8.5 1.2 6 1Z" fill={s.seedColor} style={{ transition: 'fill 0.8s' }} />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <span
          className="text-[20px] tracking-[0.04em] text-[#111] mt-6"
          style={{ fontWeight: 400, opacity: s.wordmark ? 1 : 0, transition: 'opacity 0.6s' }}
        >
          bloomsline
        </span>

        {/* Narration */}
        <p className="text-[13px] text-neutral-500 text-center max-w-xs mt-6 h-12 flex items-center justify-center" style={{ transition: 'all 0.3s' }}>
          {s.text}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-8">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STORY_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setMode('manual'); setStep(i) }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === step ? T : '#e5e5e5',
                  transform: i === step ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Prev / Next */}
          {mode === 'manual' && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-neutral-200 text-neutral-500 hover:text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(Math.min(STORY_STEPS.length - 1, step + 1))}
                disabled={step === STORY_STEPS.length - 1}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: T }}
              >
                Next
              </button>
            </div>
          )}

          <span className="text-[10px] text-neutral-300 ml-2">{step + 1} / {STORY_STEPS.length}</span>
        </div>
      </div>
    </div>
  )
}

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

        {/* ════ SECTION 5: CONTROLLED IMPERFECTION ════ */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mt-20 mb-2">Controlled Imperfection</h2>
        <p className="text-[11px] text-neutral-400 mb-6">One deliberate imperfection in an otherwise precise design. &quot;We are rigorous, but we are human.&quot;</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">

          <Card title="The Bitten Circle" subtitle="A circle with a soft bite. The missing piece is the space between sessions — what Bloomsline fills.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <mask id="bite1"><rect width="44" height="44" fill="white" /><circle cx="38" cy="34" r="10" fill="black" /></mask>
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" mask="url(#bite1)" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Notched Circle" subtitle="A notch at the bottom — like a bowl that holds, or a smile. The opening welcomes you in.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <mask id="notch1"><rect width="44" height="44" fill="white" /><circle cx="22" cy="44" r="8" fill="black" /></mask>
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" mask="url(#notch1)" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Crescent" subtitle="A circle eclipsed by itself — a moon phase. Not full, not empty. In progress. Always becoming.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <mask id="crescent1"><rect width="44" height="44" fill="white" /><circle cx="28" cy="20" r="16" fill="black" /></mask>
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" mask="url(#crescent1)" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Pebble" subtitle="Not a circle — a smooth stone worn by water. Nature doesn't make perfect circles. Neither does care.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="46" height="42" viewBox="0 0 46 42" fill="none">
                <path d="M23 3C12 2 4 10 3 20C2 30 10 39 22 40C34 41 43 33 44 23C45 13 36 4 23 3Z" fill={T} opacity="0.85" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Bloom Bite" subtitle="A petal-shaped piece missing — like a bloom that shed one petal. Beautiful because it's not complete.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <mask id="bloombite"><rect width="44" height="44" fill="white" /><ellipse cx="40" cy="10" rx="8" ry="12" fill="black" transform="rotate(30 40 10)" /></mask>
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" mask="url(#bloombite)" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Opening" subtitle="A circle with a clean gap. Not broken — opening. A door slightly ajar. An invitation, not a boundary.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path d="M36 8C32 4.5 27 3 22 3C11.5 3 3 11.5 3 22C3 32.5 11.5 41 22 41C32.5 41 41 32.5 41 22C41 17 39 12.5 36 9" stroke={T} strokeWidth="5" strokeLinecap="round" fill="none" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Held Circle" subtitle="A filled circle cradled by a thin arc. The arc is the practitioner. The circle is the member. Held, not trapped.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="13" fill={T} opacity="0.8" />
                <path d="M6 36C6 20 12 8 22 8C32 8 38 20 38 36" stroke={T} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Pinch" subtitle="A circle with one side pinched in. Like something gently leaned against it. Soft pressure, not force.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" />
                <circle cx="4" cy="22" r="6" fill={bg === 'dark' ? '#0f0f0f' : 'white'} />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

          <Card title="The Leaf Bite" subtitle="A circle with a leaf-shaped absence at top. The missing piece grew into something. Loss that becomes growth.">{(bg) => (
            <div className="flex flex-col items-center gap-5">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <mask id="leafbite"><rect width="44" height="44" fill="white" /><path d="M22 0C22 0 30 4 34 10C30 8 22 8 22 0Z" fill="black" /></mask>
                <circle cx="22" cy="22" r="19" fill={T} opacity="0.85" mask="url(#leafbite)" />
              </svg>
              <span className={`text-[20px] tracking-[0.04em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
          )}</Card>

        </div>

        {/* Imperfection App Icons */}
        <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Imperfection — App Icons</h2>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-3">
          {[
            <svg key="i1" width="30" height="30" viewBox="0 0 44 44" fill="none"><mask id="bi1"><rect width="44" height="44" fill="white" /><circle cx="38" cy="34" r="10" fill="black" /></mask><circle cx="22" cy="22" r="19" fill={T} mask="url(#bi1)" /></svg>,
            <svg key="i2" width="30" height="30" viewBox="0 0 44 44" fill="none"><mask id="ni1"><rect width="44" height="44" fill="white" /><circle cx="22" cy="44" r="8" fill="black" /></mask><circle cx="22" cy="22" r="19" fill={T} mask="url(#ni1)" /></svg>,
            <svg key="i3" width="30" height="30" viewBox="0 0 44 44" fill="none"><mask id="ci1"><rect width="44" height="44" fill="white" /><circle cx="28" cy="20" r="16" fill="black" /></mask><circle cx="22" cy="22" r="19" fill={T} mask="url(#ci1)" /></svg>,
            <svg key="i4" width="30" height="30" viewBox="0 0 46 42" fill="none"><path d="M23 3C12 2 4 10 3 20C2 30 10 39 22 40C34 41 43 33 44 23C45 13 36 4 23 3Z" fill={T} /></svg>,
            <svg key="i5" width="30" height="30" viewBox="0 0 44 44" fill="none"><mask id="bbi"><rect width="44" height="44" fill="white" /><ellipse cx="40" cy="10" rx="8" ry="12" fill="black" transform="rotate(30 40 10)" /></mask><circle cx="22" cy="22" r="19" fill={T} mask="url(#bbi)" /></svg>,
            <svg key="i6" width="30" height="30" viewBox="0 0 44 44" fill="none"><path d="M36 8C32 4.5 27 3 22 3C11.5 3 3 11.5 3 22C3 32.5 11.5 41 22 41C32.5 41 41 32.5 41 22C41 17 39 12.5 36 9" stroke={T} strokeWidth="5" strokeLinecap="round" fill="none" /></svg>,
            <svg key="i7" width="30" height="30" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="13" fill={T} /><path d="M6 36C6 20 12 8 22 8C32 8 38 20 38 36" stroke={T} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" /></svg>,
            <svg key="i8" width="30" height="30" viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="19" fill={T} /><circle cx="4" cy="22" r="6" fill="white" /></svg>,
            <svg key="i9" width="30" height="30" viewBox="0 0 44 44" fill="none"><mask id="lbi"><rect width="44" height="44" fill="white" /><path d="M22 0C22 0 30 4 34 10C30 8 22 8 22 0Z" fill="black" /></mask><circle cx="22" cy="22" r="19" fill={T} mask="url(#lbi)" /></svg>,
          ].map((icon, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white border border-neutral-200 flex items-center justify-center">
              {icon}
            </div>
          ))}
        </div>

        {/* ════ SECTION 6: THE IMPERFECTION STORY ════ */}
        <div className="mt-20 mb-8">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">The Imperfection Story</h2>
          <div className="max-w-xl">
            <p className="text-[12px] text-neutral-500 leading-relaxed mb-2">The circle represents what we all aspire to — wholeness. But real mental health isn&apos;t about becoming a perfect circle. It&apos;s about accepting the opening.</p>
            <p className="text-[12px] text-neutral-500 leading-relaxed mb-2">The missing piece isn&apos;t broken — it&apos;s <strong className="text-neutral-700">the door where care enters</strong>.</p>
            <p className="text-[12px] text-neutral-500 leading-relaxed">And that door changes color based on what&apos;s happening — because care looks different in every moment.</p>
          </div>
        </div>

        {/* Story 1: The Door */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door — The gap holds a colored seed that changes with context</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <mask id={`door-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask>
                  <circle cx="26" cy="26" r="22" fill={T} opacity="0.12" mask={`url(#door-${i})`} />
                  <circle cx="26" cy="26" r="22" fill="none" stroke={T} strokeWidth="2.5" mask={`url(#door-${i})`} />
                  <path d="M42 34.5C40 34.3 38.5 36 38.3 38C38.1 40 39.5 41.7 42 41.9C44.5 42.1 46.2 40.4 46 38.2C45.8 36 44 34.7 42 34.5Z" fill={mode.color} opacity="0.9" />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story 1B: The Door — Refined (no border, filled, premium) */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v2 — Filled, no border. Solid and confident. The seed floats in the gap.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <mask id={`doorv2-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask>
                  <circle cx="26" cy="26" r="22" fill={T} opacity="0.85" mask={`url(#doorv2-${i})`} />
                  <path d="M42 35C40.2 34.8 38.8 36.2 38.6 38C38.4 39.8 39.8 41.3 42 41.5C44.2 41.7 45.8 40.2 45.6 38.2C45.4 36.2 43.8 35.2 42 35Z" fill={mode.color} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story 1C: Softer bite, larger seed, ultra minimal */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v3 — Softer bite, bigger seed. The imperfection is generous, not sharp.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <mask id={`doorv3-${i}`}><rect width="52" height="52" fill="white" /><circle cx="42" cy="40" r="14" fill="black" /></mask>
                  <circle cx="24" cy="24" r="22" fill={T} opacity="0.85" mask={`url(#doorv3-${i})`} />
                  <path d="M40 33.5C37 33.2 34.5 35.5 34.3 38.5C34 41.5 36.5 43.8 40 44C43.5 44.2 46.2 41.8 46 38.5C45.8 35.2 43 33.8 40 33.5Z" fill={mode.color} opacity="0.9" />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ ANNOTATED COMPARISON ═══ */}
        <div className="mt-16 mb-16">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Anatomy — One Story in Three Parts</h3>

          <div className="max-w-lg mb-10 space-y-3">
            <p className="text-[13px] text-neutral-700 leading-relaxed"><strong className="text-neutral-900">The circle is you.</strong> Not perfect — because nobody is. And that&apos;s not a flaw. It&apos;s where the story begins.</p>
            <p className="text-[13px] text-neutral-700 leading-relaxed"><strong className="text-neutral-900">The opening is the moment you let someone in</strong> — a practitioner, a resource, a conversation you weren&apos;t sure you were ready for. It&apos;s not a crack. It&apos;s a door.</p>
            <p className="text-[13px] text-neutral-700 leading-relaxed"><strong className="text-neutral-900">The seed is what grows from that opening.</strong> Small. Colored by what&apos;s happening right now — care, insight, a moment, an emotion. Always rising.</p>
            <p className="text-[13px] text-neutral-500 leading-relaxed italic">A person who opened up. And something beautiful grew from it.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Original — seed bottom-right */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-8">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6 text-center">Seed at Bottom-Right</p>
              <div className="flex flex-col items-center mb-8">
                <svg width="120" height="120" viewBox="0 0 52 52" fill="none">
                  <defs><mask id="ann-orig"><rect width="52" height="52" fill="white" /><circle cx="43" cy="39" r="12" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.35" mask="url(#ann-orig)" />
                  <path d="M41 33C38.8 32.8 37 34.8 36.8 37C36.6 39.2 38.5 41.2 41 41.4C43.5 41.6 45.5 39.5 45.3 37.2C45.1 34.9 43.2 33.2 41 33Z" fill={T} />
                </svg>
                <span className="text-[18px] tracking-[0.04em] text-[#111] mt-3" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <table className="w-full text-[11px] mb-6">
                <tbody>
                  <tr className="border-b border-neutral-100"><td className="py-2 text-neutral-400 w-24">Circle</td><td className="py-2 text-neutral-600">The whole person</td></tr>
                  <tr className="border-b border-neutral-100"><td className="py-2 text-neutral-400">Bite</td><td className="py-2 text-neutral-600">The gap between sessions</td></tr>
                  <tr><td className="py-2" style={{ color: T }}>Seed</td><td className="py-2 text-neutral-600">The moment — at the bottom</td></tr>
                </tbody>
              </table>
              <div className="bg-red-50 rounded-xl p-4 space-y-1.5">
                <p className="text-[10px] text-red-500">Seed sinks — feels heavy, falling</p>
                <p className="text-[10px] text-red-500">Eye reads it last — bottom-right</p>
                <p className="text-[10px] text-red-500">Disconnected from wordmark</p>
              </div>
            </div>

            {/* RIGHT: Flipped — seed top-left */}
            <div className="bg-white rounded-2xl border-2 border-teal-200 p-8">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-6 text-center">Seed at Top-Left (Rising)</p>
              <div className="flex flex-col items-center mb-8">
                <svg width="120" height="120" viewBox="0 0 52 52" fill="none">
                  <defs><mask id="ann-flip"><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="12" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.35" mask="url(#ann-flip)" />
                  <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
                </svg>
                <span className="text-[18px] tracking-[0.04em] text-[#111] mt-3" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <table className="w-full text-[11px] mb-6">
                <tbody>
                  <tr className="border-b border-neutral-100"><td className="py-2 w-24" style={{ color: T }}>Seed</td><td className="py-2 text-neutral-600">The moment — rising upward</td></tr>
                  <tr className="border-b border-neutral-100"><td className="py-2 text-neutral-400">Opening</td><td className="py-2 text-neutral-600">Where care enters</td></tr>
                  <tr><td className="py-2 text-neutral-400">Circle</td><td className="py-2 text-neutral-600">The whole person — grounded below</td></tr>
                </tbody>
              </table>
              <div className="bg-teal-50 rounded-xl p-4 space-y-1.5">
                <p className="text-[10px] text-teal-700">Seed rises — growth, hope, blooming</p>
                <p className="text-[10px] text-teal-700">Eye hits seed first — top-left reading</p>
                <p className="text-[10px] text-teal-700">Circle weight below — stable, confident</p>
                <p className="text-[10px] text-teal-700">Connects naturally to wordmark</p>
              </div>
            </div>

          </div>
        </div>

        {/* ═══ ANIMATED NARRATIVE ═══ */}
        <StoryAnimation />

        {/* Story 1D-original: Muted circle + vibrant seed — original position */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v4 (original) — Seed at bottom-right</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`doorv4og-${i}`}><rect width="52" height="52" fill="white" /><circle cx="43" cy="39" r="12" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.35" mask={`url(#doorv4og-${i})`} />
                  <path d="M41 33C38.8 32.8 37 34.8 36.8 37C36.6 39.2 38.5 41.2 41 41.4C43.5 41.6 45.5 39.5 45.3 37.2C45.1 34.9 43.2 33.2 41 33Z" fill={mode.color} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Story 1D-flipped: Muted circle + vibrant seed — flipped to top-left */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v4 (rising) — Seed at top-left. The imperfection is what catches your eye first.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`doorv4-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="12" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.35" mask={`url(#doorv4-${i})`} />
                  <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={mode.color} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story 1E: Dark circle + colored seed — for dark mode / premium feel */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v5 — Dark base. The seed glows. Premium, editorial, confident.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-[#111] p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`doorv5-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="12" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#333" mask={`url(#doorv5-${i})`} />
                  <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={mode.color} style={{ filter: `drop-shadow(0 0 6px ${mode.color}60)` }} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-white mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story 1F: Teal circle + seed detached — floating nearby, not inside */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Door v6 — The seed floats outside. It hasn&apos;t entered yet. The invitation is open.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="58" height="56" viewBox="0 0 58 56" fill="none">
                  <mask id={`doorv6-${i}`}><rect width="58" height="56" fill="white" /><circle cx="46" cy="42" r="12" fill="black" /></mask>
                  <circle cx="24" cy="24" r="22" fill={T} opacity="0.85" mask={`url(#doorv6-${i})`} />
                  <path d="M52 44.5C50 44.3 48.5 46 48.3 48C48.1 50 49.5 51.7 52 51.9C54.5 52.1 56.2 50.4 56 48.2C55.8 46 54 44.7 52 44.5Z" fill={mode.color} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-3" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

{/* Story 2: The Breath */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Breath — The gap itself takes the color. The opening IS the emotion.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <path d="M42 11C38 6 32 4 26 4C13.8 4 4 13.8 4 26C4 38.2 13.8 48 26 48C38.2 48 48 38.2 48 26C48 21 46 16 42 12" stroke="#d4d4d4" strokeWidth="3" strokeLinecap="round" />
                  <path d="M42 12C46 16 48 21 48 26" stroke={mode.color} strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Story 3: The Seed */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Seed — Something grows from the imperfection. The crack is where the light gets in.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="56" viewBox="0 0 52 56" fill="none">
                  <circle cx="26" cy="30" r="20" fill="#e5e5e5" opacity="0.35" />
                  <circle cx="26" cy="30" r="20" fill="none" stroke="#d4d4d4" strokeWidth="2" />
                  <path d="M26 10V2" stroke={mode.color} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M26 6C26 6 21 2 19 0" stroke={mode.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <path d="M26 6C26 6 31 2 33 0" stroke={mode.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-3" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Story 4: The Pulse */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Pulse — A quiet heartbeat at the edge. Small. Alive. Always there.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <div className="relative">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" fill={T} opacity="0.85" />
                  </svg>
                  <div className="absolute w-3 h-3 rounded-full" style={{ background: mode.color, top: 2, right: 2, boxShadow: `0 0 8px ${mode.color}40` }} />
                </div>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Story 5: The Eclipse */}
        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">The Eclipse — Something is always behind the surface. The color reveals what&apos;s underneath.</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="56" height="48" viewBox="0 0 56 48" fill="none">
                  <circle cx="34" cy="24" r="18" fill={mode.color} opacity="0.25" />
                  <circle cx="24" cy="24" r="20" fill={T} opacity="0.85" />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* The Story Summary */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-8">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">The Brand Story in One Mark</h3>
          <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
            <p>The Bloomsline logo is a circle that isn&apos;t complete — because <strong className="text-neutral-800">completeness isn&apos;t the goal</strong>. The goal is to keep the door open.</p>
            <p>The imperfection changes color based on context:</p>
            <div className="flex flex-wrap gap-2 my-4">
              {[
                { color: T, bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', label: 'Care — sessions, resources, sharing' },
                { color: L, bg: '', text: '', label: 'Insight — Bloom AI, patterns, analysis', custom: true },
                { color: '#F59E0B', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Moment — check-in, mood, reflection' },
                { color: '#F472B6', bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700', label: 'Emotion — vulnerability, breakthroughs' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${item.custom ? '' : item.bg}`} style={item.custom ? { background: '#A88AE110', borderColor: '#A88AE140' } : undefined}>
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className={`text-[10px] font-medium ${item.custom ? '' : item.text}`} style={item.custom ? { color: '#7B62B8' } : undefined}>{item.label}</span>
                </div>
              ))}
            </div>
            <p>One mark. One story. Infinite expressions. The logo doesn&apos;t just represent Bloomsline — it <strong className="text-neutral-800">behaves</strong> like it.</p>
          </div>
        </div>

        {/* ════ SECTION 7: ANIMATED BEHAVIORS ════ */}
        <div className="mt-20 mb-8">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">The Seed in Motion</h2>
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-xl">The seed isn&apos;t static. It breathes, orbits, pulses, and responds — just like care does. Each animation represents a different emotional state.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">

          {/* A1: Breathing — seed gently scales up and down */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[260px]">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <mask id="anim-breathe"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                  <circle cx="27" cy="27" r="24" fill={T} opacity="0.85" mask="url(#anim-breathe)" />
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 2, right: 0 }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0.6, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Seed color={T} />
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-5" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Breathing</p>
              <p className="text-[11px] text-neutral-400">At rest. The app is open, care is present. A gentle inhale and exhale. Used on dashboard, idle states.</p>
            </div>
          </div>

          {/* A2: Fading — seed gently fades in and out */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[260px]">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <mask id="anim-fade"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                  <circle cx="27" cy="27" r="24" fill={T} opacity="0.85" mask="url(#anim-fade)" />
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 2, right: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Seed color={L} />
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-5" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Appearing</p>
              <p className="text-[11px] text-neutral-400">An insight is forming. Not yet clear, but present. The seed fades in — awareness arriving slowly.</p>
            </div>
          </div>

          {/* A3: Color shift — seed changes color, nothing else moves */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[260px]">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <mask id="anim-shift"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                  <circle cx="27" cy="27" r="24" fill={T} opacity="0.85" mask="url(#anim-shift)" />
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 2, right: 0 }}
                  animate={{ color: [T, L, '#F59E0B', '#F472B6', T] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1C3.5 0.8 1 3 0.8 6C0.6 9 3 11.2 6 11.4C9 11.6 11.4 9.2 11.2 6.2C11 3.2 8.5 1.2 6 1Z" fill="currentColor" />
                  </svg>
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-5" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Shifting</p>
              <p className="text-[11px] text-neutral-400">Care is many things. The seed stays still — only its color changes. Slow, quiet, continuous.</p>
            </div>
          </div>

          {/* A4: Gentle float — seed moves up and down by 2px */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[260px]">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <mask id="anim-float"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                  <circle cx="27" cy="27" r="24" fill={T} opacity="0.85" mask="url(#anim-float)" />
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 2, right: 0 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Seed color="#F59E0B" />
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-5" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Floating</p>
              <p className="text-[11px] text-neutral-400">A moment is being held. Not going anywhere — just present. A tiny, almost invisible lift.</p>
            </div>
          </div>

          {/* A5: Glow — seed has a soft pulsing glow, nothing moves */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-[#111] p-12 flex flex-col items-center justify-center min-h-[260px]">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <mask id="anim-glow"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                  <circle cx="27" cy="27" r="24" fill="#333" mask="url(#anim-glow)" />
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 2, right: 0, filter: 'drop-shadow(0 0 0px #F472B600)' }}
                  animate={{ filter: ['drop-shadow(0 0 0px #F472B600)', 'drop-shadow(0 0 8px #F472B660)', 'drop-shadow(0 0 0px #F472B600)'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Seed color="#F472B6" />
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-white mt-5" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Glowing</p>
              <p className="text-[11px] text-neutral-400">Something tender is happening. The seed doesn&apos;t move — it just softly radiates. Dark mode only.</p>
            </div>
          </div>

        </div>

        {/* ════ SECTION 8: COLOR SPREAD ANIMATIONS ════ */}
        <div className="mt-20 mb-8">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">The Spread</h2>
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-xl">The seed touches the edge and its color slowly bleeds into the circle. Care spreading gently — not all at once, but in its own time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">

          {/* S1: Teal — slow fill from the bite */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs>
                    <mask id="spread-1-mask"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask>
                    <clipPath id="spread-1-clip"><circle cx="27" cy="27" r="24" /></clipPath>
                  </defs>
                  <circle cx="27" cy="27" r="24" fill="#e5e5e5" opacity="0.3" mask="url(#spread-1-mask)" />
                  <g clipPath="url(#spread-1-clip)" mask="url(#spread-1-mask)">
                    <motion.circle cx="43" cy="39" fill={T} opacity="0.12" animate={{ r: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                  </g>
                </svg>
                {/* Seed sitting at the edge */}
                <div className="absolute" style={{ bottom: 4, right: 0 }}>
                  <Seed color={T} />
                </div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Care Spreading</p>
              <p className="text-[11px] text-neutral-400">The seed touches the circle and teal slowly fills it. Care arriving. Very slow, very gentle. 8 second cycle.</p>
            </div>
          </div>

          {/* S2: Lavender spread */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs><mask id="s2m"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask><clipPath id="s2c"><circle cx="27" cy="27" r="24" /></clipPath></defs>
                  <circle cx="27" cy="27" r="24" fill="#e5e5e5" opacity="0.3" mask="url(#s2m)" />
                  <g clipPath="url(#s2c)" mask="url(#s2m)"><motion.circle cx="43" cy="39" fill={L} opacity="0.1" animate={{ r: [0, 50, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} /></g>
                </svg>
                <div className="absolute" style={{ bottom: 4, right: 0 }}>
                  <Seed color={L} />
                </div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Insight Spreading</p>
              <p className="text-[11px] text-neutral-400">Lavender bleeds in even slower. An insight forming — you can barely tell it&apos;s happening until it&apos;s there.</p>
            </div>
          </div>

          {/* S3: Amber spread */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs><mask id="s3m"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask><clipPath id="s3c"><circle cx="27" cy="27" r="24" /></clipPath></defs>
                  <circle cx="27" cy="27" r="24" fill="#e5e5e5" opacity="0.3" mask="url(#s3m)" />
                  <g clipPath="url(#s3c)" mask="url(#s3m)"><motion.circle cx="43" cy="39" fill="#F59E0B" opacity="0.1" animate={{ r: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} /></g>
                </svg>
                <div className="absolute" style={{ bottom: 4, right: 0 }}>
                  <Seed color="#F59E0B" />
                </div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Moment Spreading</p>
              <p className="text-[11px] text-neutral-400">A warm amber glow fills the circle. A moment was captured — its warmth spreads through everything.</p>
            </div>
          </div>

          {/* S4: Rose spread — dark mode */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-[#0f0f0f] p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs><mask id="s4m"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask><clipPath id="s4c"><circle cx="27" cy="27" r="24" /></clipPath></defs>
                  <circle cx="27" cy="27" r="24" fill="#2a2a2a" mask="url(#s4m)" />
                  <g clipPath="url(#s4c)" mask="url(#s4m)"><motion.circle cx="43" cy="39" fill="#F472B6" opacity="0.15" animate={{ r: [0, 50, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} /></g>
                </svg>
                <div className="absolute" style={{ bottom: 4, right: 0 }}>
                  <Seed color="#F472B6" />
                </div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-white mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Emotion Spreading (dark)</p>
              <p className="text-[11px] text-neutral-400">Rose light fills the dark. Emotion arriving in the quiet. The most vulnerable version.</p>
            </div>
          </div>

          {/* S5: All colors cycling spread */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs><mask id="s5m"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask><clipPath id="s5c"><circle cx="27" cy="27" r="24" /></clipPath></defs>
                  <circle cx="27" cy="27" r="24" fill="#e5e5e5" opacity="0.3" mask="url(#s5m)" />
                  <g clipPath="url(#s5c)" mask="url(#s5m)"><motion.circle cx="43" cy="39" opacity="0.12" animate={{ r: [0, 50, 50, 0], fill: [T, T, L, L] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} /></g>
                </svg>
                <motion.div
                  className="absolute"
                  style={{ bottom: 4, right: 0 }}
                  animate={{ color: [T, L, '#F59E0B', '#F472B6', T] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1C3.5 0.8 1 3 0.8 6C0.6 9 3 11.2 6 11.4C9 11.6 11.4 9.2 11.2 6.2C11 3.2 8.5 1.2 6 1Z" fill="currentColor" />
                  </svg>
                </motion.div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Full Spectrum</p>
              <p className="text-[11px] text-neutral-400">The seed changes color and each color spreads through the circle. The full story in one animation. For brand moments, loading screens.</p>
            </div>
          </div>

          {/* S6: Spread that stays — fills and holds */}
          <div className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="bg-white p-12 flex flex-col items-center justify-center min-h-[280px]">
              <div className="relative w-[56px] h-[56px]">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute inset-0">
                  <defs><mask id="s6m"><rect width="56" height="56" fill="white" /><circle cx="47" cy="43" r="12" fill="black" /></mask><clipPath id="s6c"><circle cx="27" cy="27" r="24" /></clipPath></defs>
                  <circle cx="27" cy="27" r="24" fill="#e5e5e5" opacity="0.3" mask="url(#s6m)" />
                  <g clipPath="url(#s6c)" mask="url(#s6m)"><motion.circle cx="43" cy="39" fill={T} animate={{ r: [0, 50, 50, 50, 0], opacity: [0, 0.12, 0.12, 0.12, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.5, 0.7, 1] }} /></g>
                </svg>
                <div className="absolute" style={{ bottom: 4, right: 0 }}>
                  <Seed color={T} />
                </div>
              </div>
              <span className="text-[17px] tracking-[0.04em] text-[#111] mt-6" style={{ fontWeight: 400 }}>bloomsline</span>
            </div>
            <div className="px-5 py-4 bg-[#FAFAFA] border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800 mb-0.5">Fill &amp; Hold</p>
              <p className="text-[11px] text-neutral-400">The color spreads, holds for a moment — then gently recedes. Like a breath that lingers before exhaling.</p>
            </div>
          </div>

        </div>

        {/* ════ SECTION 8B: FLIPPED — Bite bottom-right, seed top-left ════ */}
        <div className="mt-20 mb-8">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">Flipped — Seed Rising</h2>
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-xl">Bite at bottom-right, seed at top-left. The seed rises upward — growth, hope, something emerging.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { color: T, label: 'Care', context: 'Sessions, notes, sharing' },
            { color: L, label: 'Insight', context: 'Bloom AI, patterns' },
            { color: '#F59E0B', label: 'Moment', context: 'Daily check-in, moods' },
            { color: '#F472B6', label: 'Emotion', context: 'Vulnerability, breakthroughs' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`flip-l-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.3" mask={`url(#flip-l-${i})`} />
                  <path d="M10 13C7.8 12.7 6.2 14.2 6 16C5.8 17.8 7.2 19.5 10 19.7C12.8 19.9 14.4 18.2 14.2 16C14 13.8 12.2 13.3 10 13Z" fill={mode.color} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-[#111] mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                  <span className="text-[11px] font-semibold text-neutral-700">{mode.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400">{mode.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flipped dark */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { color: T, label: 'Care' },
            { color: L, label: 'Insight' },
            { color: '#F59E0B', label: 'Moment' },
            { color: '#F472B6', label: 'Emotion' },
          ].map((mode, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="bg-[#0f0f0f] p-8 flex flex-col items-center justify-center min-h-[200px]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`flip-d-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#2a2a2a" mask={`url(#flip-d-${i})`} />
                  <path d="M10 13C7.8 12.7 6.2 14.2 6 16C5.8 17.8 7.2 19.5 10 19.7C12.8 19.9 14.4 18.2 14.2 16C14 13.8 12.2 13.3 10 13Z" fill={mode.color} style={{ filter: `drop-shadow(0 0 6px ${mode.color}50)` }} />
                </svg>
                <span className="text-[16px] tracking-[0.04em] text-white mt-4" style={{ fontWeight: 400 }}>bloomsline</span>
              </div>
              <div className="px-4 py-3 bg-[#FAFAFA] border-t border-neutral-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: mode.color }} />
                <span className="text-[11px] font-medium text-neutral-600">{mode.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Flipped — horizontal lockups */}
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-4">Flipped — Lockups</p>
        <div className="space-y-3 mb-16">
          {[
            { weight: 300, tracking: '0.08em', label: 'Light + wide', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Regular + teal OO', type: 'tealOO' },
            { weight: 420, tracking: '0.03em', label: 'Split weight', type: 'split' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 px-8 py-6 flex items-center gap-6">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" className="flex-shrink-0">
                <defs><mask id={`flk-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.3" mask={`url(#flk-${i})`} />
                <path d="M10 13C7.8 12.7 6.2 14.2 6 16C5.8 17.8 7.2 19.5 10 19.7C12.8 19.9 14.4 18.2 14.2 16C14 13.8 12.2 13.3 10 13Z" fill={T} />
              </svg>
              <div className="flex-1">
                {s.type === 'split' ? (
                  <div className="flex items-baseline"><span className="text-[22px] text-[#111]" style={{ fontWeight: 460, letterSpacing: s.tracking }}>blooms</span><span className="text-[22px] text-[#111]/40" style={{ fontWeight: 300, letterSpacing: s.tracking }}>line</span></div>
                ) : s.type === 'tealOO' ? (
                  <span className="text-[22px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
                ) : (
                  <span className="text-[22px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
                )}
              </div>
              <span className="text-[10px] text-neutral-300 flex-shrink-0">{s.label}</span>
            </div>
          ))}
          {/* Dark lockups */}
          {[
            { weight: 400, tracking: '0.04em', type: 'plain' },
            { weight: 400, tracking: '0.04em', type: 'tealOO' },
          ].map((s, i) => (
            <div key={`d${i}`} className="bg-[#111] rounded-xl px-8 py-6 flex items-center gap-6">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" className="flex-shrink-0">
                <defs><mask id={`flkd-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#2a2a2a" mask={`url(#flkd-${i})`} />
                <path d="M10 13C7.8 12.7 6.2 14.2 6 16C5.8 17.8 7.2 19.5 10 19.7C12.8 19.9 14.4 18.2 14.2 16C14 13.8 12.2 13.3 10 13Z" fill={T} />
              </svg>
              {s.type === 'tealOO' ? (
                <span className="text-[22px] text-white flex-1" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
              ) : (
                <span className="text-[22px] text-white flex-1" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
              )}
            </div>
          ))}
        </div>

        {/* ════ SECTION 9: LOGO + WORDMARK LOCKUPS ════ */}
        <div className="mt-20 mb-8">
          <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2">Mark + Wordmark Lockups</h2>
          <p className="text-[12px] text-neutral-500 leading-relaxed max-w-xl">The same imperfect circle paired with different typographic treatments. Toggle between original and flipped.</p>
        </div>

        <div className="space-y-3 mb-16">
          {[
            { weight: 300, tracking: '0.08em', label: 'Ultra light + wide — luxury, Aesop energy', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Regular — balanced, Stripe energy', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Teal "oo" — two O\'s are two people', type: 'tealOO' },
            { weight: 420, tracking: '0.03em', label: '"blooms" medium + "line" light — two weights', type: 'split' },
            { weight: 400, tracking: '0.04em', label: 'Teal underscore on "line"', type: 'underline' },
            { weight: 350, tracking: '0.06em', label: 'Light + wide + teal "oo"', type: 'tealOO' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 px-8 py-6 flex items-center gap-6">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" className="flex-shrink-0">
                <defs><mask id={`lk-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.3" mask={`url(#lk-${i})`} />
                <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
              </svg>
              <div className="flex-1">
                {s.type === 'split' ? (
                  <div className="flex items-baseline">
                    <span className="text-[22px] text-[#111]" style={{ fontWeight: 460, letterSpacing: s.tracking }}>blooms</span>
                    <span className="text-[22px] text-[#111]/40" style={{ fontWeight: 300, letterSpacing: s.tracking }}>line</span>
                  </div>
                ) : s.type === 'tealOO' ? (
                  <span className="text-[22px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
                ) : s.type === 'underline' ? (
                  <span className="text-[22px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>blooms<span className="relative"><span className="relative z-10">line</span><span className="absolute bottom-0.5 left-0 right-0 h-[2px] rounded-full" style={{ background: T, opacity: 0.5 }} /></span></span>
                ) : (
                  <span className="text-[22px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
                )}
              </div>
              <span className="text-[10px] text-neutral-300 flex-shrink-0 max-w-[200px] text-right">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Dark variants */}
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-4">Dark Variants</p>
        <div className="space-y-3 mb-16">
          {[
            { weight: 300, tracking: '0.08em', type: 'plain' },
            { weight: 400, tracking: '0.04em', type: 'tealOO' },
            { weight: 420, tracking: '0.03em', type: 'split' },
            { weight: 400, tracking: '0.04em', type: 'underline' },
          ].map((s, i) => (
            <div key={i} className="bg-[#111] rounded-xl px-8 py-6 flex items-center gap-6">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" className="flex-shrink-0">
                <defs><mask id={`lkd-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#2a2a2a" mask={`url(#lkd-${i})`} />
                <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
              </svg>
              {s.type === 'split' ? (
                <div className="flex items-baseline flex-1"><span className="text-[22px] text-white" style={{ fontWeight: 460, letterSpacing: s.tracking }}>blooms</span><span className="text-[22px] text-white/35" style={{ fontWeight: 300, letterSpacing: s.tracking }}>line</span></div>
              ) : s.type === 'tealOO' ? (
                <span className="text-[22px] text-white flex-1" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
              ) : s.type === 'underline' ? (
                <span className="text-[22px] text-white flex-1" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>blooms<span className="relative"><span className="relative z-10">line</span><span className="absolute bottom-0.5 left-0 right-0 h-[2px] rounded-full" style={{ background: T, opacity: 0.4 }} /></span></span>
              ) : (
                <span className="text-[22px] text-white flex-1" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
              )}
            </div>
          ))}
        </div>

        {/* Stacked */}
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-6">Stacked — Mark Above Wordmark</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
          {[
            { weight: 300, tracking: '0.08em', label: 'Light', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Regular', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Teal OO', type: 'tealOO' },
            { weight: 420, tracking: '0.03em', label: 'Split weight', type: 'split' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-8 flex flex-col items-center justify-center min-h-[200px]">
              <svg width="44" height="44" viewBox="0 0 52 52" fill="none" className="mb-4">
                <defs><mask id={`stk-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.3" mask={`url(#stk-${i})`} />
                <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
              </svg>
              {s.type === 'tealOO' ? (
                <span className="text-[15px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
              ) : s.type === 'split' ? (
                <div className="flex items-baseline"><span className="text-[15px] text-[#111]" style={{ fontWeight: 460, letterSpacing: s.tracking }}>blooms</span><span className="text-[15px] text-[#111]/40" style={{ fontWeight: 300, letterSpacing: s.tracking }}>line</span></div>
              ) : (
                <span className="text-[15px] text-[#111]" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
              )}
              <span className="text-[9px] text-neutral-300 mt-2">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-16">
          {[
            { weight: 300, tracking: '0.08em', label: 'Light', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Regular', type: 'plain' },
            { weight: 400, tracking: '0.04em', label: 'Teal OO', type: 'tealOO' },
            { weight: 420, tracking: '0.03em', label: 'Split weight', type: 'split' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-[#111] p-8 flex flex-col items-center justify-center min-h-[200px]">
              <svg width="44" height="44" viewBox="0 0 52 52" fill="none" className="mb-4">
                <defs><mask id={`stkd-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                <circle cx="27" cy="27" r="22" fill="#2a2a2a" mask={`url(#stkd-${i})`} />
                <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
              </svg>
              {s.type === 'tealOO' ? (
                <span className="text-[15px] text-white" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bl<span style={{ color: T }}>oo</span>msline</span>
              ) : s.type === 'split' ? (
                <div className="flex items-baseline"><span className="text-[15px] text-white" style={{ fontWeight: 460, letterSpacing: s.tracking }}>blooms</span><span className="text-[15px] text-white/35" style={{ fontWeight: 300, letterSpacing: s.tracking }}>line</span></div>
              ) : (
                <span className="text-[15px] text-white" style={{ fontWeight: s.weight, letterSpacing: s.tracking }}>bloomsline</span>
              )}
              <span className="text-[9px] text-neutral-500 mt-2">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Scale test */}
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-4">Scale Test</p>
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-8">
          {[
            { markSize: 16, textSize: 10, label: '16px — favicon, browser tab' },
            { markSize: 24, textSize: 13, label: '24px — nav bar' },
            { markSize: 36, textSize: 18, label: '36px — page header' },
            { markSize: 56, textSize: 26, label: '56px — hero section' },
            { markSize: 80, textSize: 36, label: '80px — print, billboard' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <svg width={s.markSize} height={s.markSize} viewBox="0 0 52 52" fill="none">
                  <defs><mask id={`sc-${i}`}><rect width="52" height="52" fill="white" /><circle cx="8" cy="10" r="11" fill="black" /></mask></defs>
                  <circle cx="27" cy="27" r="22" fill="#d4d4d4" opacity="0.3" mask={`url(#sc-${i})`} />
                  <path d="M10 7C7.8 6.8 6 8.8 5.8 11C5.6 13.2 7.5 15.2 10 15.4C12.5 15.6 14.5 13.5 14.3 11.2C14.1 8.9 12.2 7.2 10 7Z" fill={T} />
                </svg>
                <span className="text-[#111]" style={{ fontSize: s.textSize, fontWeight: 400, letterSpacing: '0.04em' }}>bloomsline</span>
              </div>
              <span className="text-[10px] text-neutral-300 ml-auto">{s.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

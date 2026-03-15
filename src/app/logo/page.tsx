'use client'

import { useState } from 'react'

type Bg = 'light' | 'dark'

function Card({ title, children }: { title: string; children: (bg: Bg) => React.ReactNode }) {
  const [bg, setBg] = useState<Bg>('light')
  return (
    <div className="rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className={`relative p-12 flex items-center justify-center min-h-[240px] transition-colors cursor-pointer ${bg === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'}`}
        onClick={() => setBg(bg === 'light' ? 'dark' : 'light')}
      >
        {children(bg)}
        <span className="absolute bottom-3 right-3 text-[9px] text-neutral-300">{bg === 'light' ? 'click for dark' : 'click for light'}</span>
      </div>
      <div className="px-4 py-2.5 bg-[#FAFAFA] border-t border-neutral-100">
        <span className="text-[11px] font-medium text-neutral-500">{title}</span>
      </div>
    </div>
  )
}

// Wordmark
function W({ bg, weight = 450 }: { bg: Bg; weight?: number }) {
  return (
    <span className={`text-[20px] tracking-[0.03em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`} style={{ fontWeight: weight }}>
      bloomsline
    </span>
  )
}

// Colors
const T = '#3D9B85' // teal
const L = '#A88AE1' // lavender

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-8 py-20">
        <h1 className="text-lg font-semibold text-neutral-800 mb-1">Logo</h1>
        <p className="text-xs text-neutral-400 mb-16">Click any card to toggle background.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* ── 1. Gradient circle ── */}
          <Card title="Gradient">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full" style={{ background: `linear-gradient(135deg, ${T}, ${L})` }} />
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 2. Soft overlap ── */}
          <Card title="Overlap">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-9 flex items-center">
                <div className="absolute left-0 w-8 h-8 rounded-full" style={{ background: T, opacity: 0.85 }} />
                <div className="absolute left-3.5 w-8 h-8 rounded-full" style={{ background: L, opacity: 0.55 }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 3. Rounded square mark ── */}
          <Card title="App Mark">{(bg) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${T}, ${L})` }}>
                <span className="text-white text-[18px] font-semibold leading-none">b</span>
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 4. Ring ── */}
          <Card title="Ring">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full" style={{ border: `2.5px solid ${T}` }} />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full" style={{ background: L }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 5. Two dots ── */}
          <Card title="Duo">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full" style={{ background: T }} />
                <div className="w-5 h-5 rounded-full" style={{ background: L, opacity: 0.65 }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 6. Sprout ── */}
          <Card title="Sprout">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
                <path d="M13 28V15" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M13 15C13 9 7 5 3 3C5 9 9 13 13 15Z" fill={T} />
                <path d="M13 19C13 13 19 9 23 7C21 13 17 17 13 19Z" fill={L} opacity="0.55" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 7. Halves ── */}
          <Card title="Halves">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-[2px]">
                <div className="w-[14px] h-[28px] rounded-l-full" style={{ background: T }} />
                <div className="w-[14px] h-[28px] rounded-r-full" style={{ background: L, opacity: 0.65 }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 8. Cradle ── */}
          <Card title="Cradle">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="28" height="26" viewBox="0 0 28 26" fill="none">
                <path d="M4 18C4 10 8 4 14 4" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M24 18C24 10 20 4 14 4" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <circle cx="14" cy="15" r="3" fill={T} />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 9. Heart outline ── */}
          <Card title="Heart">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
                <path d="M13 22L2.5 12C0.5 10 0.5 6 2.5 4C4.5 2 8.5 2 10.5 4L13 6.5L15.5 4C17.5 2 21.5 2 23.5 4C25.5 6 25.5 10 23.5 12L13 22Z" stroke={T} strokeWidth="2" strokeLinejoin="round" fill="none" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 10. Bars ── */}
          <Card title="Bars">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="flex gap-[3px] items-end h-7">
                <div className="w-[4px] rounded-full" style={{ height: 10, background: L, opacity: 0.45 }} />
                <div className="w-[4px] rounded-full" style={{ height: 16, background: T, opacity: 0.7 }} />
                <div className="w-[4px] rounded-full" style={{ height: 28, background: T }} />
                <div className="w-[4px] rounded-full" style={{ height: 20, background: T, opacity: 0.8 }} />
                <div className="w-[4px] rounded-full" style={{ height: 12, background: L, opacity: 0.5 }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 11. Typographic "oo" ── */}
          <Card title="Type">{(bg) => (
            <span className={`text-[22px] font-[420] tracking-[0.03em] ${bg === 'dark' ? 'text-white' : 'text-[#111]'}`}>
              bl<span style={{ color: T }}>oo</span>msline
            </span>
          )}</Card>

          {/* ── 12. Monogram outline ── */}
          <Card title="Monogram">{(bg) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{ border: `2.5px solid ${T}` }}>
                <span className="text-[18px] font-semibold leading-none" style={{ color: T }}>b</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: L }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 13. Horizon ── */}
          <Card title="Horizon">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                <circle cx="15" cy="14" r="8" fill={T} />
                <rect x="0" y="14" width="30" height="6" fill={bg === 'dark' ? '#0f0f0f' : 'white'} />
                <line x1="1" y1="14" x2="29" y2="14" stroke={bg === 'dark' ? '#333' : '#e0e0e0'} strokeWidth="1.5" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 14. Line bloom ── */}
          <Card title="Growth">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
                <path d="M2 18C6 15 10 7 15 5C20 3 24 9 28 5" stroke={T} strokeWidth="2" strokeLinecap="round" />
                <circle cx="15" cy="5" r="4" fill={L} opacity="0.5" />
                <circle cx="15" cy="5" r="2" fill={T} />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 15. Stacked circles ── */}
          <Card title="Stack">{(bg) => (
            <div className="flex items-center gap-3.5">
              <div className="relative w-10 h-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full" style={{ background: T, opacity: 0.35 }} />
                <div className="absolute bottom-0 left-0 w-6 h-6 rounded-full" style={{ background: T, opacity: 0.6 }} />
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full" style={{ background: L, opacity: 0.45 }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 16. Pill ── */}
          <Card title="Pill">{(bg) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 rounded-full" style={{ background: `linear-gradient(90deg, ${T}, ${L})` }} />
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 17. Abstract B leaf ── */}
          <Card title="B-Leaf">{(bg) => (
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect width="30" height="30" rx="8" fill={T} />
                <path d="M10 7V23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M10 7C10 7 20 7 20 12.5C20 18 10 15 10 15" fill="white" opacity="0.85" />
                <path d="M10 15C10 15 20 13 20 19C20 24 10 23 10 23" fill="white" opacity="0.6" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 18. Dot in square ── */}
          <Card title="Focus">{(bg) => (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ border: `2px solid ${bg === 'dark' ? '#333' : '#e0e0e0'}` }}>
                <div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${T}, ${L})` }} />
              </div>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ═══ LINE-BASED / INTERTWINED ═══ */}

          {/* ── 19. Intertwined loops — two organic loops crossing ── */}
          <Card title="Intertwine">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
                <path d="M12 6C6 6 2 10 2 16C2 22 6 26 12 26C18 26 22 22 22 16" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M24 26C30 26 34 22 34 16C34 10 30 6 24 6C18 6 14 10 14 16" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 20. Knot — two teardrop paths crossing through each other ── */}
          <Card title="Knot">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                <path d="M17 4C10 4 4 10 4 17C4 24 10 30 17 30C20 30 23 28 25 25" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M17 30C24 30 30 24 30 17C30 10 24 4 17 4C14 4 11 6 9 9" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 21. Orbit — two ellipses crossing at angles like an atom ── */}
          <Card title="Orbit">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <ellipse cx="18" cy="18" rx="14" ry="8" stroke={T} strokeWidth="2.5" transform="rotate(-30 18 18)" />
                <ellipse cx="18" cy="18" rx="14" ry="8" stroke={L} strokeWidth="2.5" transform="rotate(30 18 18)" opacity="0.6" />
                <circle cx="18" cy="18" r="2.5" fill={T} />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 22. Flow — two flowing S-curves intertwining ── */}
          <Card title="Flow">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="34" height="30" viewBox="0 0 34 30" fill="none">
                <path d="M4 26C4 18 12 18 17 15C22 12 30 12 30 4" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M4 4C4 12 12 12 17 15C22 18 30 18 30 26" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <circle cx="17" cy="15" r="2.5" fill={T} />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 23. Petals — three rounded triangle paths forming a trefoil ── */}
          <Card title="Trefoil">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                <path d="M17 6C13 6 10 10 10 14C10 18 13 20 17 20C21 20 24 18 24 14C24 10 21 6 17 6Z" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M8 22C6 18 6 14 9 11C12 8 16 9 19 12C22 15 22 19 19 22C16 25 12 25 8 22Z" stroke={T} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d="M26 22C28 18 28 14 25 11C22 8 18 9 15 12C12 15 12 19 15 22C18 25 22 25 26 22Z" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 24. Weave — two rounded paths weaving over/under ── */}
          <Card title="Weave">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="36" height="30" viewBox="0 0 36 30" fill="none">
                {/* Back strand */}
                <path d="M4 8C10 8 10 15 18 15" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                <path d="M18 15C26 15 26 22 32 22" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                {/* Front strand */}
                <path d="M4 22C10 22 10 15 18 15" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M18 15C26 15 26 8 32 8" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="15" r="2.5" fill={T} />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 25. Embrace — two arms wrapping into each other ── */}
          <Card title="Embrace">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 24C6 14 12 8 16 8C20 8 22 12 22 16" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M26 8C26 18 20 24 16 24C12 24 10 20 10 16" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 26. Infinity — clean infinity with gradient halves ── */}
          <Card title="Infinity">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="38" height="22" viewBox="0 0 38 22" fill="none">
                <path d="M19 11C19 6 15 3 11 3C6 3 3 7 3 11C3 15 6 19 11 19C15 19 19 16 19 11Z" stroke={T} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M19 11C19 16 23 19 27 19C32 19 35 15 35 11C35 7 32 3 27 3C23 3 19 6 19 11Z" stroke={L} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 27. Spiral bloom — logarithmic spiral opening outward ── */}
          <Card title="Spiral">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 16C16 14 18 12 20 12C23 12 25 14 25 17C25 21 22 24 18 24C13 24 9 20 9 15C9 9 14 5 20 5C27 5 32 10 32 17" stroke={T} strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="16" r="2" fill={L} opacity="0.7" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

          {/* ── 28. Connected — two loops linked like chain ── */}
          <Card title="Linked">{(bg) => (
            <div className="flex items-center gap-3.5">
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                <rect x="3" y="5" width="16" height="14" rx="7" stroke={T} strokeWidth="2.5" fill="none" />
                <rect x="19" y="5" width="16" height="14" rx="7" stroke={L} strokeWidth="2.5" fill="none" opacity="0.6" />
              </svg>
              <W bg={bg} />
            </div>
          )}</Card>

        </div>
      </div>
    </div>
  )
}

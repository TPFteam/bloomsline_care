'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

// ─── Section nav: a left rail to jump straight to any part of the vision ──────
const navItems = [
  { id: 'intro', label: 'Vision' },
  { id: 'sources', label: 'Two apps' },
  { id: 'material', label: 'Raw material' },
  { id: 'phase1', label: 'Labeling' },
  { id: 'clusters', label: 'Clusters' },
  { id: 'model', label: 'The model' },
  { id: 'doors', label: 'Where it goes' },
  { id: 'boundary', label: 'The line' },
  { id: 'science', label: 'The science' },
]

function SideNav() {
  const [active, setActive] = useState('intro')
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    navItems.forEach((n) => { const el = document.getElementById(n.id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-0.5">
      {navItems.map((n) => {
        const on = active === n.id
        return (
          <button key={n.id} onClick={() => go(n.id)} className="group flex items-center gap-2.5 py-1 text-left">
            <span className={`h-px transition-all duration-300 ${on ? 'w-7 bg-teal-700' : 'w-3 bg-neutral-300 group-hover:bg-neutral-500'}`} />
            <span className={`text-[11px] tracking-wide transition-colors ${on ? 'text-teal-700 font-medium' : 'text-neutral-400 group-hover:text-neutral-600'}`}>{n.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Data pillars: why our raw material is different ─────────────────────────
const pillars = [
  { k: 'Depth', world: 'Surface signals, a click, a like', us: 'What people actually feel, in their own words' },
  { k: 'Over time', world: 'A snapshot, one moment', us: 'The same person, week after week' },
  { k: 'Ground truth', world: 'No way to know if it was real', us: 'Did they actually get better?' },
  { k: 'Expert-labeled', world: 'Guessed by an algorithm', us: 'Read and understood by a clinician' },
]

// ─── Phase 1 pipeline: raw signal → understanding ────────────────────────────
const pipeline = [
  { t: 'Signal', d: 'Sessions, notes, moods, reflections' },
  { t: 'Clean', d: 'Strip the noise' },
  { t: 'Label', d: 'A clinician gives it meaning', hot: true },
  { t: 'Cluster', d: 'Patterns become groups' },
  { t: 'Model', d: 'Understanding that compounds' },
]

// ─── Where it goes: three expanding rings, reach widening as data compounds ───
const rings = [
  {
    stage: '01', name: 'Care', reach: 'For each person', bar: 30,
    cases: [
      { t: 'Personalized care', d: 'Match a patient to the group they resemble, and surface what helps, from day one.' },
      { t: 'Early warning', d: 'Signals over time flag a patient drifting toward relapse.' },
    ],
    value: 'Faster progress, and reaching people before a crisis, not after.',
  },
  {
    stage: '02', name: 'Science', reach: 'For the whole field', bar: 62,
    cases: [
      { t: 'What actually works', d: 'Anonymized, aggregated outcomes reveal which approaches help which people.' },
    ],
    value: 'A living evidence base, and a foundation for published research.',
  },
  {
    stage: '03', name: 'Platform', reach: 'For every app', bar: 100, highlight: true,
    cases: [
      { t: 'Day-one personalization · the understanding layer', d: 'Apps plug in and personalize from question one. No data to collect, store, or process.' },
    ],
    value: 'Higher conversion and retention, with none of the data burden.',
  },
]

// ─── The science this vision builds on (field-level anchors) ─────────────────
// NOTE: these are real, established research areas with their recognized
// names. Exact citations + links to be verified and added before sharing.
const research = [
  { area: 'Digital phenotyping', note: 'Everyday digital signals as a window into mental state. A field introduced by Thomas Insel, former director of the US National Institute of Mental Health.' },
  { area: 'Measurement-based care', note: 'Routinely measuring how a patient is doing, and tuning care to it, improves outcomes in therapy.' },
  { area: 'Language as signal', note: 'Machine analysis of psychotherapy language to read session quality and outcomes (the research behind tools like Lyssn).' },
  { area: 'The intention-behavior gap', note: 'What people say they will do often differs from what they actually do. Real behavior is the stronger signal (Sheeran and colleagues).' },
  { area: 'Precision psychiatry', note: 'Matching the right approach to the right person, instead of treating the average patient.' },
]

// ─── Named clusters: illustrative "types of people" the model surfaces ───────
const clusters = [
  { name: 'Quiet copers', color: '#0d9488', cx: 24, cy: 38, pattern: 'Look fine on the outside, holding a lot underneath.', helps: 'Respond best to steady, structured check-ins.' },
  { name: 'Anxious mornings', color: '#b45309', cx: 60, cy: 62, pattern: 'Hardest at the start of the day, calmer by night.', helps: 'Respond best to a short morning grounding practice.' },
  { name: 'After a loss', color: '#7c3aed', cx: 82, cy: 33, pattern: 'Moving through grief or a big change.', helps: 'Respond best to slow, reflective journaling.' },
]

// Scattered points, each belonging to one cluster.
const clusterDots: { x: number; y: number; g: 0 | 1 | 2 }[] = [
  { x: 18, y: 30, g: 0 }, { x: 26, y: 22, g: 0 }, { x: 14, y: 44, g: 0 }, { x: 30, y: 38, g: 0 }, { x: 22, y: 52, g: 0 }, { x: 34, y: 28, g: 0 },
  { x: 54, y: 64, g: 1 }, { x: 62, y: 56, g: 1 }, { x: 50, y: 74, g: 1 }, { x: 66, y: 70, g: 1 }, { x: 58, y: 48, g: 1 }, { x: 70, y: 60, g: 1 },
  { x: 78, y: 26, g: 2 }, { x: 86, y: 34, g: 2 }, { x: 74, y: 40, g: 2 }, { x: 90, y: 22, g: 2 }, { x: 82, y: 46, g: 2 },
]

// Interactive cluster map: tap a group and its data flows together while the
// others fade, then reveals the pattern and what helps that group.
function ClustersViz() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div>
      <div className="relative rounded-2xl border border-neutral-200 bg-white/40 overflow-hidden" style={{ height: 300 }}>
        {/* Soft halos behind each cluster */}
        {clusters.map((c, i) => (
          <motion.span
            key={`h${i}`}
            className="absolute rounded-full pointer-events-none"
            animate={{ opacity: active === null ? 0.06 : active === i ? 0.14 : 0.02 }}
            transition={{ duration: 0.5 }}
            style={{ left: `${c.cx}%`, top: `${c.cy}%`, width: 170, height: 170, backgroundColor: c.color, marginLeft: -85, marginTop: -85 }}
          />
        ))}

        {/* Dots — flow toward their centroid when their cluster is active */}
        {clusterDots.map((d, i) => {
          const c = clusters[d.g]
          const isActive = active === d.g
          const dim = active !== null && active !== d.g
          const pull = isActive ? 0.5 : 0
          const x = d.x + (c.cx - d.x) * pull
          const y = d.y + (c.cy - d.y) * pull
          return (
            <motion.span
              key={i}
              className="absolute rounded-full"
              animate={{ left: `${x}%`, top: `${y}%`, opacity: dim ? 0.12 : 0.9, scale: isActive ? 1.5 : 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ width: 12, height: 12, backgroundColor: c.color, marginLeft: -6, marginTop: -6 }}
            />
          )
        })}

        {/* Detail card for the active cluster */}
        <AnimatePresence>
          {active !== null && (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35 }}
              className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-xs rounded-xl bg-white shadow-lg border border-neutral-100 px-5 py-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clusters[active].color }} />
                <span className="text-sm font-semibold text-neutral-900">{clusters[active].name}</span>
              </div>
              <p className="text-xs font-light text-neutral-500 leading-relaxed mb-2">{clusters[active].pattern}</p>
              <p className="text-xs font-medium leading-relaxed" style={{ color: clusters[active].color }}>{clusters[active].helps}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clickable cluster legend */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {clusters.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActive(active === i ? null : i)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active === i ? 'border-transparent text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
            style={active === i ? { backgroundColor: c.color } : undefined}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active === i ? '#fff' : c.color }} />
            {c.name}
          </button>
        ))}
        <span className="text-[11px] text-neutral-400 font-light ml-1">tap a group · illustrative</span>
      </div>
    </div>
  )
}

export default function VisionPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#FAF8F5' }}>
      <SideNav />
      <div className="mx-auto max-w-5xl px-6 sm:px-10">

        {/* ─── Hero ───────────────────────────────────────────────────── */}
        <section id="intro" className="scroll-mt-8 pt-20 pb-16">
          <motion.p
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.35em] uppercase text-teal-700 mb-6"
          >
            Bloomsline · The Vision
          </motion.p>
          <motion.h1
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight max-w-4xl"
          >
            A tool today.
            <br />
            A model of how people change tomorrow.
          </motion.h1>
          <motion.p
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-xl text-neutral-500 font-light max-w-2xl"
          >
            Every session on Bloomsline produces the rarest data there is. Over time, it becomes a foundation no one else can build.
          </motion.p>
        </section>

        {/* ─── Two sides, one picture ─────────────────────────────────── */}
        <section id="sources" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            Where it comes from
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            Two apps. <span className="text-teal-700">Two kinds of truth.</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-neutral-200 bg-white/40 px-7 py-7"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-2">Practitioner app · Qualitative</div>
              <div className="text-lg font-medium text-neutral-900 mb-1.5">The why</div>
              <p className="text-sm font-light text-neutral-500 leading-relaxed">
                The clinician&apos;s lens: notes, context, and meaning. A trained professional reading what is really going on.
              </p>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-neutral-200 bg-white/40 px-7 py-7"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-2">Patient app · Quantitative</div>
              <div className="text-lg font-medium text-neutral-900 mb-1.5">The what</div>
              <p className="text-sm font-light text-neutral-500 leading-relaxed">
                The patient&apos;s signal: moods, moments, check-ins, and what they actually do between sessions, as it happens.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 rounded-2xl bg-teal-700 px-7 py-6"
          >
            <p className="text-base sm:text-lg font-light text-white leading-snug">
              Qualitative depth from one side, quantitative signal from the other. Together, a picture neither app could see alone.
            </p>
          </motion.div>
        </section>

        {/* ─── Why our data is different ──────────────────────────────── */}
        <section id="material" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            The raw material
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            Everyone wants a model of human behavior.
            <span className="text-teal-700"> We start with the only data worth trusting.</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.k}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-neutral-200 bg-white/40 px-7 py-6"
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-teal-700 mb-3">{p.k}</div>
                <p className="text-sm font-light text-neutral-400 line-through decoration-neutral-300 mb-1.5">{p.world}</p>
                <p className="text-[15px] font-normal text-neutral-900 leading-snug">{p.us}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Phase 1: the pipeline ──────────────────────────────────── */}
        <section id="phase1" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            Phase 1 · The hard part
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            Raw feeling isn&apos;t data. Turning it into understanding is the work.
          </motion.h2>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
            {pipeline.map((s, i) => (
              <motion.div
                key={s.t}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-stretch sm:flex-1"
              >
                <div className={`flex-1 rounded-2xl px-5 py-6 ${s.hot ? 'bg-teal-700' : 'border border-neutral-200 bg-white/40'}`}>
                  <div className={`text-[10px] tracking-[0.25em] uppercase mb-2 ${s.hot ? 'text-teal-200' : 'text-neutral-400'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className={`text-base font-medium mb-1 ${s.hot ? 'text-white' : 'text-neutral-900'}`}>{s.t}</div>
                  <div className={`text-xs font-light leading-snug ${s.hot ? 'text-teal-100' : 'text-neutral-500'}`}>{s.d}</div>
                </div>
                {i < pipeline.length - 1 && (
                  <div className="hidden sm:flex items-center px-1 text-neutral-300">→</div>
                )}
              </motion.div>
            ))}
          </div>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm text-neutral-500 font-light max-w-3xl"
          >
            The label is everything. Ours come from clinicians and are proven by the outcome, not guessed from clicks. That is what makes the model accurate, and almost impossible to copy.
          </motion.p>
        </section>

        {/* ─── Clusters emerge ────────────────────────────────────────── */}
        <section id="clusters" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            What emerges
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            Patterns become groups.
            <span className="text-teal-700"> Groups become understanding.</span>
          </motion.h2>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.7 }}
          >
            <ClustersViz />
          </motion.div>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm text-neutral-500 font-light max-w-3xl"
          >
            People who present the same way, who respond to the same support, who move at the same pace. The model learns who is who, and what helps each one.
          </motion.p>
        </section>

        {/* ─── The model ──────────────────────────────────────────────── */}
        <section id="model" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-teal-700 px-8 py-12 sm:px-12 sm:py-16"
          >
            <div className="text-[10px] tracking-[0.3em] uppercase text-teal-200 mb-4">The foundation</div>
            <p className="text-2xl sm:text-4xl font-light text-white leading-snug max-w-3xl">
              A foundational model of how people actually change, interpreted by clinicians, proven by outcomes.
            </p>
          </motion.div>
        </section>

        {/* ─── Where it goes ──────────────────────────────────────────── */}
        <section id="doors" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            Where it goes
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-3"
          >
            It starts with care. <span className="text-teal-700">The reach keeps widening.</span>
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm text-neutral-500 font-light max-w-2xl mb-10"
          >
            Each ring needs the one before it. The deeper the care, the bigger the model, the wider it reaches.
          </motion.p>

          <div className="border-t border-neutral-200">
            {rings.map((r, i) => (
              <motion.div
                key={r.stage}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-3 sm:gap-8 py-7 border-b border-neutral-200"
              >
                {/* Left: stage + reach + widening bar */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extralight text-neutral-300">{r.stage}</span>
                    <span className={`text-base font-semibold ${r.highlight ? 'text-teal-700' : 'text-neutral-900'}`}>{r.name}</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">{r.reach}</div>
                  <div className="mt-3 h-1 w-32 rounded-full bg-neutral-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${r.bar}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
                      className={`h-full rounded-full ${r.highlight ? 'bg-teal-600' : 'bg-teal-700/60'}`}
                    />
                  </div>
                </div>

                {/* Right: the use case(s) + value */}
                <div>
                  {r.cases.map((c) => (
                    <div key={c.t} className="mb-3 last:mb-0">
                      <div className="text-[15px] font-medium text-neutral-900">{c.t}</div>
                      <p className="text-sm font-light text-neutral-500 leading-relaxed">{c.d}</p>
                    </div>
                  ))}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="shrink-0 text-[10px] tracking-[0.2em] uppercase text-teal-600">Value</span>
                    <span className="text-[13px] font-light text-neutral-700 leading-snug">{r.value}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Horizon — same engine, new fields */}
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-sm text-neutral-400 font-light italic max-w-3xl"
          >
            And the same engine travels wherever care is continuous: coaching, chronic care, education.
          </motion.p>
        </section>

        {/* ─── The line we never cross ────────────────────────────────── */}
        <section id="boundary" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-8"
          >
            The line we never cross.
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-neutral-200 bg-white/40 px-7 py-6"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-3">Never</div>
              <ul className="space-y-2 text-[15px] font-light text-neutral-600">
                <li>Never identifies a person</li>
                <li>Never sold to advertisers</li>
                <li>Never used to influence or manipulate</li>
              </ul>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-teal-200 bg-teal-50/40 px-7 py-6"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-teal-600 mb-3">Always</div>
              <ul className="space-y-2 text-[15px] font-light text-teal-800">
                <li>Always with consent</li>
                <li>Always anonymous and aggregated</li>
                <li>Always in service of the person</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ─── The science behind this ────────────────────────────────── */}
        <section id="science" className="scroll-mt-8 pb-20 border-t border-neutral-200 pt-14">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-3"
          >
            The science behind this
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            We are not the first to see this.
            <span className="text-teal-700"> We are the first with the data to build it.</span>
          </motion.h2>

          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {research.map((r, i) => (
              <motion.div
                key={r.area}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-8 py-5"
              >
                <div className="text-[15px] font-medium text-neutral-900">{r.area}</div>
                <div className="text-sm font-light text-neutral-500 leading-relaxed max-w-2xl">{r.note}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Close ──────────────────────────────────────────────────── */}
        <section className="py-20 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl"
          >
            Today, a tool therapists love.
            <span className="text-teal-700"> Tomorrow, the layer that understands how people heal.</span>
          </motion.p>
        </section>

      </div>
    </div>
  )
}

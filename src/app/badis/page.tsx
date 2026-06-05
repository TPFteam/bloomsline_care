'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

type Loc = { en: string; fr: string }

type MindNodeData = {
  q: Loc
  a?: Loc
  bullets?: { en: string[]; fr: string[] }
  accent?: boolean
  children?: MindNodeData[]
}

const discovery: MindNodeData = {
  q: {
    en: 'We started with Doctalink — helping people find the right therapist.',
    fr: 'On a commencé avec Doctalink — aider les gens à trouver le bon thérapeute.',
  },
  a: {
    en: 'It worked, and people liked it. But it wasn’t where people got stuck. So we kept asking…',
    fr: 'Ça marchait, et les gens aimaient. Mais ce n’était pas là que les gens bloquaient. Alors on a continué à demander…',
  },
  children: [
    {
      q: { en: 'So where did people actually get stuck?', fr: 'Alors, où est-ce que les gens bloquaient vraiment ?' },
      a: {
        en: 'Not in finding the therapist. In what happens once therapy starts.',
        fr: 'Pas pour trouver le thérapeute. Dans ce qui se passe une fois la thérapie commencée.',
      },
      children: [
        {
          q: { en: 'Where exactly?', fr: 'Où exactement ?' },
          bullets: {
            en: [
              'The whole therapy rests on one thing: the bond between the psychologist and the patient.',
              'That bond is held by the cadre — the framework — and the framework has to fit each patient.',
              'If it isn’t adjusted in time, the bond can break in a fraction of a second.',
            ],
            fr: [
              'Toute la thérapie repose sur une chose : le lien entre le psychologue et le patient.',
              'Ce lien tient grâce au cadre — et le cadre doit s’adapter à chaque patient.',
              'Si l’ajustement n’est pas fait à temps, le lien peut se rompre en une fraction de seconde.',
            ],
          },
          children: [
            {
              q: {
                en: 'So why can’t the therapist stop it?',
                fr: 'Alors pourquoi le thérapeute ne peut-il rien y faire ?',
              },
              bullets: {
                en: [
                  'Out of the room, they’re blind — they can’t see the bond slipping between sessions.',
                  'In the room, they’re only human — one hour, a lot to hold, and something important can slip past: a missed signal, a moment of distraction, too much at once.',
                ],
                fr: [
                  'Hors séance, il est aveugle — il ne voit pas le lien se fragiliser entre les rendez-vous.',
                  'En séance, il reste humain — une heure, beaucoup à suivre, et quelque chose d’important peut lui échapper : un signal manqué, un instant d’inattention, trop de choses à la fois.',
                ],
              },
              children: [
                {
                  q: { en: 'How much time is that?', fr: 'Ça fait combien de temps ?' },
                  a: {
                    en: 'One hour they can see. 167 hours they can’t.',
                    fr: 'Une heure qu’il voit. 167 heures qu’il ne voit pas.',
                  },
                  children: [
                    {
                      q: { en: 'And in those 167 hours?', fr: 'Et pendant ces 167 heures ?' },
                      a: {
                        en: 'The patient can’t see their progress, feels unsupported, slips back into old habits, and gives up. One in three stops coming.',
                        fr: 'Le patient ne voit pas ses progrès, se sent livré à lui-même, retombe dans ses vieilles habitudes, et abandonne. Un sur trois arrête.',
                      },
                      children: [
                        {
                          q: { en: 'So, the real problem?', fr: 'Alors, le vrai problème ?' },
                          a: {
                            en: 'It’s not that therapy doesn’t work. It’s that nothing supports the 167 hours in between — so the work is harder, and progress stays hard to see.',
                            fr: 'Ce n’est pas que la thérapie ne marche pas. C’est que rien ne soutient les 167 heures entre les séances — alors le travail est plus dur, et les progrès restent difficiles à voir.',
                          },
                          accent: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function MindNode({ node, lang, depth = 0 }: { node: MindNodeData; lang: 'en' | 'fr'; depth?: number }) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = !!node.children && node.children.length > 0
  return (
    <div className={depth > 0 ? 'border-l border-neutral-200 pl-4 sm:pl-6 ml-1' : ''}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-start gap-3 text-left w-full py-2"
      >
        <span
          className={`mt-[5px] shrink-0 text-[11px] transition-transform duration-200 ${open ? 'rotate-90' : ''} ${node.accent ? 'text-teal-600' : 'text-neutral-400'}`}
        >
          ▶
        </span>
        <span
          className={`text-base sm:text-lg font-medium leading-snug group-hover:opacity-70 transition-opacity ${node.accent ? 'text-teal-700' : 'text-neutral-900'}`}
        >
          {node.q[lang]}
        </span>
      </button>
      {open && (
        <div className="ml-7 pb-1">
          {node.a && (
            <p className={`text-sm font-light leading-relaxed pb-2 max-w-2xl ${node.accent ? 'text-teal-700/80' : 'text-neutral-500'}`}>
              {node.a[lang]}
            </p>
          )}
          {node.bullets && (
            <ul className="list-disc pl-5 space-y-1.5 pb-2 max-w-2xl">
              {node.bullets[lang].map((b, i) => (
                <li
                  key={i}
                  className={`text-sm font-light leading-relaxed ${node.accent ? 'text-teal-700/80' : 'text-neutral-500'}`}
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
          {hasChildren &&
            node.children!.map((c, i) => <MindNode key={i} node={c} lang={lang} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

const layers = [
  {
    depth: 'SURFACE',
    actor: 'The practitioner',
    line: 'The lost thread.',
    detail: '“My client shared something painful on Tuesday. By our next session, I’d lost the thread.”',
    stat: '10–15 min',
    statLabel: 'of every session spent rebuilding context',
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    sub: 'text-teal-700/70',
    tag: 'text-teal-600',
  },
  {
    depth: 'DEEPER',
    actor: 'The patient',
    line: 'Alone between sessions.',
    detail: 'They forget what mattered, fall back into old patterns, disengage — and leave.',
    stat: '~35%',
    statLabel: 'drop out of therapy',
    bg: 'bg-teal-700',
    text: 'text-white',
    sub: 'text-teal-100/80',
    tag: 'text-teal-200',
  },
  {
    depth: 'DEEPEST',
    actor: 'The system',
    line: 'No infrastructure for continuity.',
    detail: 'Continuity is one of the strongest predictors of whether therapy works — yet the system treats the session as the unit of care. The real unit is the journey.',
    stat: '0',
    statLabel: 'tools built for the space between sessions',
    bg: 'bg-neutral-900',
    text: 'text-white',
    sub: 'text-neutral-400',
    tag: 'text-neutral-500',
  },
]

const scaleLayers = [
  {
    region: 'France',
    note: 'our beachhead',
    bg: 'bg-white border border-neutral-200',
    text: 'text-neutral-900',
    sub: 'text-neutral-500',
    stats: [
      { v: '69M', l: 'people' },
      { v: '~8M', l: 'adults with depression each year' },
      { v: '28K', l: 'psychologists in private practice — who we serve' },
      { v: '~35%', l: 'drop out of therapy' },
    ],
    src: [
      { label: 'INSEE', url: 'https://www.insee.fr/fr/statistiques/8719824' },
      { label: 'Santé publique France', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/rapportsynthese/episodes-depressifs-prevalence-et-recours-aux-soins-barometre-de-sante-publique-france-resultats-de' },
      { label: 'DREES', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
    ],
  },
  {
    region: 'Europe',
    note: 'the bloc',
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    sub: 'text-teal-700/70',
    stats: [
      { v: '450M', l: 'people' },
      { v: '~84M', l: 'live with a mental health condition' },
      { v: '17×', l: 'France’s practitioner base' },
    ],
    src: [
      { label: 'OECD · Health at a Glance: Europe', url: 'https://www.oecd.org/en/publications/health-at-a-glance-europe-2018_health_glance_eur-2018-en.html' },
    ],
  },
  {
    region: 'World',
    note: 'the horizon',
    bg: 'bg-neutral-900',
    text: 'text-white',
    sub: 'text-neutral-400',
    stats: [
      { v: '8B', l: 'people' },
      { v: '1B+', l: 'live with a mental health condition' },
      { v: 'every therapy', l: 'breaks between sessions' },
    ],
    src: [
      { label: 'WHO 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
    ],
  },
]

const horizons = [
  {
    tag: 'Today',
    title: 'Continuity',
    body: 'The layer of care between sessions. Make the thread unbreakable.',
    who: 'The young practitioner · France',
    accent: 'text-teal-700',
  },
  {
    tag: 'Next',
    title: 'Visibility',
    body: 'Make therapy’s invisible progress visible. Real outcome signals.',
    who: 'Group practices & clinics · francophone Europe',
    accent: 'text-teal-700',
  },
  {
    tag: 'Later',
    title: 'Intelligence',
    body: 'Catch relapse early. Care becomes proactive — the infrastructure for mental health.',
    who: 'Institutions & systems · Europe → world',
    accent: 'text-teal-700',
  },
]

const phases = [
  {
    tag: 'Before',
    title: 'The lead-up',
    line: 'The practitioner walks in cold. Last week’s thread is gone — 10–15 min rebuilding context.',
    foot: 'no one holds the thread',
    kind: 'void' as const,
  },
  {
    tag: 'During',
    title: 'The session',
    line: 'One hour. The work happens. The only part anyone sees.',
    foot: '1 hour',
    kind: 'covered' as const,
  },
  {
    tag: 'After',
    title: 'The week after',
    line: 'The patient leaves alone. The work fades, old patterns return, they disengage.',
    foot: 'no one holds the thread',
    kind: 'void' as const,
  },
]

const hypothesisChain = [
  {
    step: 'We support the space between sessions',
    note: 'for the practitioner and the patient — together, not apart',
  },
  {
    step: 'The bond grows on its own',
    note: 'a relationship that’s held all week, not just for one hour, gets stronger',
  },
  {
    step: 'The cadre holds',
    note: 'the framework keeps its shape between sessions instead of resetting each time',
  },
  {
    step: 'Progress becomes visible',
    note: 'results are finally easy to see — for the patient and the practitioner',
  },
]

const hypothesisOutcome = 'Therapy gets easier. The patient gets better. The practice grows.'

// Indirect, projective questions — the viewer can't see the mapping. That's the
// point: a rule-based app maps answer→category; the understanding layer infers
// who you are from signals you never stated outright.
const Q = [
  { q: 'An unplanned free evening — first instinct?', opts: ['Text someone to do something', 'Dive into a project', 'Decompress alone'] },
  { q: 'Someone you like takes a day to reply.', opts: ['No big deal', 'I notice, a little', 'It lives in my head'] },
  { q: 'What makes you feel closest to someone?', opts: ['Being truly understood', 'Having fun together', 'Building toward something'] },
]

// Inferred traits — derived, NOT asked. Connection style drives the match.
const CONNECTION = [
  { trait: 'Depth-seeker', line: 'bonds by being understood — small talk drains you' },
  { trait: 'Play-first', line: 'bonds through ease and fun — pressure kills it' },
  { trait: 'Builder', line: 'bonds by building something together' },
]
const ATTACH = [
  'Secure — a slow reply doesn’t rattle you',
  'Attuned — you read the small signals',
  'Reassurance-seeking — silence gets loud',
]
const ENERGY = ['Recharges around people', 'Recharges by creating', 'Recharges in solitude']

const MATCH = [
  { name: 'Sofia, 27', emoji: '🌧️', grad: 'from-sky-300 to-indigo-300', why: 'she needs to feel understood first too — you’ll skip the small talk' },
  { name: 'Inès, 25', emoji: '🎈', grad: 'from-amber-200 to-rose-300', why: 'she leads with play, never pressure — your kind of easy' },
  { name: 'Noé, 29', emoji: '🚀', grad: 'from-emerald-300 to-teal-400', why: 'she’s building something too — she’ll get your drive' },
]
const FEED_NOTE = [
  'We slowed your feed: 3 hand-picked people, not 300.',
  'We surfaced the playful ones and hid the intense profiles.',
  'We put the people building something up top.',
]
const OPENER = [
  'ask what they’re unlearning lately',
  'send the most chaotic thing in your camera roll',
  'ask what they’re building this year',
]

const personaSteps = ['Generic dating app', 'Answer a few questions', 'It infers who you are']

// Manual click-through phone mockup. A generic dating app plugs in Bloomsline;
// from a few indirect questions it INFERS traits the viewer never stated, then
// re-tunes the whole experience to the inferred person — not to the literal answers.
function PersonalizationDemo() {
  const [stage, setStage] = useState<'cold' | 'intake' | 'reading' | 'done'>('cold')
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null])
  const allAnswered = answers.every((a) => a !== null)

  useEffect(() => {
    if (stage !== 'reading') return
    const t = setTimeout(() => setStage('done'), 1700)
    return () => clearTimeout(t)
  }, [stage])

  const reset = () => {
    setAnswers([null, null, null])
    setStage('cold')
  }
  const select = (qi: number, oi: number) =>
    setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))

  const energyPick = answers[0] ?? 0
  const attachPick = answers[1] ?? 0
  const connPick = answers[2] ?? 0 // connection style drives the personalisation
  const m = MATCH[connPick]
  const done = stage === 'done'
  const stepIdx = stage === 'cold' ? 0 : stage === 'done' ? 2 : 1

  return (
    <div className="flex select-none flex-col items-center gap-6">
      {/* Phone */}
      <div className="relative h-[520px] w-[256px] rounded-[2.75rem] bg-neutral-900 p-[10px] shadow-2xl">
        <div className="absolute left-1/2 top-[10px] z-30 h-[22px] w-[88px] -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-white">

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[9px] text-neutral-400">
            <span>9:41</span>
            <span className="uppercase tracking-widest">a dating app</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
            <div className="text-lg font-semibold text-neutral-900">{done ? 'For you' : 'Discover'}</div>
            {done ? (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[9px] font-medium text-teal-700">Understood ✓</span>
            ) : (
              <span className="text-base">🔥</span>
            )}
          </div>

          {/* COLD: a normal dating app */}
          {!done && (
            <div className="px-5">
              <div className="relative h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-300">
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90">🙂</div>
                <div className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white">?? match</div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10">
                  <div className="text-sm font-semibold text-white">Jordan, 29</div>
                  <div className="text-[10px] text-white/80">5 km away</div>
                  <div className="mt-1.5 flex gap-1">
                    {['—', '—'].map((t, i) => (
                      <span key={i} className="rounded-full bg-white/25 px-2 py-0.5 text-[9px] text-white/70">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-2 text-center text-[9px] italic text-neutral-400">
                picked at random — the app doesn’t know you yet
              </div>
              <div className="mt-3 flex justify-center gap-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-rose-200 text-lg text-rose-400">✕</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-teal-300 text-lg text-teal-500">♥</span>
              </div>
            </div>
          )}

          {/* DONE: the understanding layer + a tuned experience */}
          {done && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="px-5 space-y-2.5"
            >
              {/* Inferred understanding */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3">
                <div className="text-[11px] font-semibold text-teal-800">What Bloomsline read in you</div>
                <div className="mb-2 text-[8px] uppercase tracking-wide text-teal-700/60">inferred — you never said any of this</div>
                <ul className="space-y-1 text-[9px] leading-snug text-teal-800/90">
                  <li>· <span className="font-semibold">{CONNECTION[connPick].trait}</span> — {CONNECTION[connPick].line}</li>
                  <li>· {ATTACH[attachPick]}</li>
                  <li>· {ENERGY[energyPick]}</li>
                </ul>
              </div>

              {/* The match, chosen from the inferred trait */}
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-2.5">
                <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.grad} text-2xl`}>
                  {m.emoji}
                  <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-bold text-teal-700 shadow">94%</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-neutral-900">{m.name}</div>
                  <div className="text-[9px] leading-snug text-teal-700">✦ {m.why}</div>
                </div>
              </div>

              {/* How the app itself changed */}
              <div className="rounded-xl bg-neutral-900 p-2.5 text-[9px] leading-snug text-white">
                <div className="font-medium">{FEED_NOTE[connPick]}</div>
                <div className="text-white/60">Opener to try: {OPENER[connPick]}</div>
              </div>
            </motion.div>
          )}

          {/* Bottom action */}
          {stage === 'cold' && (
            <div className="absolute inset-x-5 bottom-5">
              <button
                onClick={() => setStage('intake')}
                className="relative w-full rounded-xl bg-neutral-900 py-3 text-center text-xs font-medium text-white transition-transform active:scale-95"
              >
                ✦ Personalize with Bloomsline
              </button>
              <motion.span
                className="pointer-events-none absolute -top-1 right-7 h-7 w-7 rounded-full bg-teal-400/40"
                animate={{ scale: [0.5, 1.4], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </div>
          )}
          {done && (
            <div className="absolute inset-x-5 bottom-4 text-center">
              <button
                onClick={reset}
                className="text-[11px] font-medium text-neutral-400 underline-offset-2 hover:text-neutral-700 hover:underline"
              >
                ↺ Start over
              </button>
            </div>
          )}

          {/* Intake sheet — indirect questions */}
          <AnimatePresence>
            {stage === 'intake' && (
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                className="absolute inset-x-0 bottom-0 top-8 z-20 flex flex-col rounded-t-3xl bg-white px-5 pb-5 pt-4 shadow-2xl"
              >
                <span className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-200" />
                <div className="text-sm font-semibold text-neutral-900">A few quick questions</div>
                <div className="mb-3 text-[10px] text-neutral-400">anonymous · nothing stored · no preferences asked</div>
                <div className="space-y-3">
                  {Q.map((qq, qi) => (
                    <div key={qi}>
                      <div className="mb-1.5 text-[11px] font-medium text-neutral-700">{qq.q}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {qq.opts.map((o, oi) => {
                          const sel = answers[qi] === oi
                          return (
                            <button
                              key={oi}
                              onClick={() => select(qi, oi)}
                              className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                                sel
                                  ? 'border-teal-600 bg-teal-600 text-white'
                                  : 'border-neutral-200 text-neutral-500 hover:border-teal-300'
                              }`}
                            >
                              {o}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  disabled={!allAnswered}
                  onClick={() => allAnswered && setStage('reading')}
                  className={`mt-auto rounded-xl py-2.5 text-center text-xs font-medium transition-colors ${
                    allAnswered
                      ? 'bg-teal-600 text-white active:scale-95'
                      : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {allAnswered ? 'Continue' : 'Pick one for each'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reading / inferring overlay */}
          <AnimatePresence>
            {stage === 'reading' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-white/95 px-6 text-center"
              >
                <span className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-teal-600" />
                <div className="text-sm font-medium text-neutral-700">Reading you…</div>
                <div className="text-[10px] text-neutral-400">inferring who you are — not what you ticked</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[11px]">
        {personaSteps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 transition-colors duration-300 ${
                stepIdx === i ? 'bg-teal-600 text-white' : 'border border-neutral-200 bg-white text-neutral-400'
              }`}
            >
              {i + 1}. {s}
            </span>
            {i < personaSteps.length - 1 && <span className="text-neutral-300">→</span>}
          </div>
        ))}
      </div>

      <p className="max-w-xs text-center text-xs text-neutral-400">
        A normal app maps <span className="text-neutral-500">answer → category</span>. Bloomsline <span className="font-medium text-teal-700">infers who you are</span> — then tunes everything to it.
      </p>
    </div>
  )
}

export default function BadisPage() {
  const [discoveryLang, setDiscoveryLang] = useState<'en' | 'fr'>('en')
  const [showDiscovery, setShowDiscovery] = useState(false)
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="mx-auto max-w-5xl px-6 sm:px-10">

        {/* Trigger — the discovery story is hidden until you click, so you can
            reveal it on-demand during a screen share (Badis sees it only then). */}
        <section className="pt-12">
          <button
            onClick={() => setShowDiscovery(true)}
            className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[11px] tracking-[0.25em] uppercase text-neutral-500 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            <span className="text-neutral-400 transition-colors group-hover:text-neutral-900">◇</span>
            How we found the problem
          </button>
        </section>

        {/* Discovery popup — the collapsible mind map, revealed on click */}
        <AnimatePresence>
          {showDiscovery && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDiscovery(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-[#FAF8F5] p-6 shadow-2xl sm:p-10"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] tracking-[0.35em] uppercase text-neutral-400">
                    {discoveryLang === 'fr' ? 'Comment on a trouvé le problème' : 'How we found the problem'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {(['en', 'fr'] as const).map((l) => (
                        <button
                          key={l}
                          onClick={() => setDiscoveryLang(l)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wider transition-colors ${
                            discoveryLang === l ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDiscovery(false)}
                      aria-label="Close"
                      className="text-2xl leading-none text-neutral-400 hover:text-neutral-700"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <p className="mb-6 text-xs font-light italic text-neutral-400">
                  {discoveryLang === 'fr'
                    ? 'Chaque question qu’on s’est posée — cliquez pour aller plus loin.'
                    : 'Each question we kept asking — tap to go deeper.'}
                </p>
                <MindNode node={discovery} lang={discoveryLang} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero — the problem */}
        <section className="pt-8 pb-16">
          <motion.p
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.35em] uppercase text-teal-700 mb-6"
          >
            Bloomsline · The Problem
          </motion.p>
          <motion.h1
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight max-w-4xl"
          >
            You see your therapist for one hour.
            <br />
            Then you’re alone with it for a week.
          </motion.h1>
          <motion.p
            initial="hidden" animate="show" variants={fade} transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-xl text-neutral-500 font-light max-w-2xl"
          >
            Therapy works. But the real work happens between the sessions — alone, and unsupported.
          </motion.p>
        </section>

        {/* Before · During · After — the anatomy of the gap */}
        <section className="pb-20">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-6"
          >
            Around every session — before · during · after
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            {phases.map((p, i) => {
              const covered = p.kind === 'covered'
              return (
                <motion.div
                  key={p.tag}
                  initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`rounded-2xl px-6 py-7 flex flex-col ${
                    covered
                      ? 'bg-teal-700'
                      : 'border-2 border-dashed border-neutral-300 bg-transparent'
                  }`}
                >
                  <div className={`text-[10px] tracking-[0.3em] uppercase mb-2 ${covered ? 'text-teal-200' : 'text-neutral-400'}`}>
                    {p.tag}
                  </div>
                  <div className={`text-lg font-medium mb-2 ${covered ? 'text-white' : 'text-neutral-500'}`}>
                    {p.title}
                  </div>
                  <p className={`text-sm font-light leading-relaxed flex-1 ${covered ? 'text-teal-50/90' : 'text-neutral-500'}`}>
                    {p.line}
                  </p>
                  <div className={`mt-4 text-[11px] uppercase tracking-wider ${covered ? 'text-teal-200' : 'text-neutral-400 italic normal-case tracking-normal'}`}>
                    {p.foot}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-lg sm:text-xl text-teal-700 italic font-light max-w-3xl"
          >
            Care lives in the one hour. The problem lives on either side of it.
          </motion.p>
        </section>

        {/* Our hypothesis */}
        <section className="py-20 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.35em] uppercase text-teal-700 mb-6"
          >
            Our hypothesis
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl"
          >
            It’s not that therapy doesn’t work. It’s that nothing supports what happens in between.
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-lg text-neutral-500 font-light max-w-2xl"
          >
            So the work is harder, progress is harder to see, and results take longer to understand — for the patient and the practitioner alike. We believe if we support that space, the rest follows on its own:
          </motion.p>

          <div className="mt-12 max-w-2xl">
            {hypothesisChain.map((h, i) => {
              const last = i === hypothesisChain.length - 1
              return (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative pl-8 pb-7 last:pb-0"
                >
                  {!last && (
                    <span className="absolute left-[7px] top-4 bottom-0 w-px bg-neutral-200" />
                  )}
                  <span
                    className={`absolute left-0 top-[5px] h-3.5 w-3.5 rounded-full border-2 ${
                      last ? 'bg-teal-600 border-teal-600' : 'bg-white border-neutral-300'
                    }`}
                  />
                  <p className={`text-lg font-medium leading-snug ${last ? 'text-teal-700' : 'text-neutral-900'}`}>
                    {h.step}
                  </p>
                  <p className={`text-sm font-light leading-relaxed ${last ? 'text-teal-700/70' : 'text-neutral-500'}`}>
                    {h.note}
                  </p>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 rounded-2xl bg-teal-700 px-6 py-5 max-w-2xl"
          >
            <p className="text-lg sm:text-xl text-white font-light">{hypothesisOutcome}</p>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-xs text-neutral-400 font-light italic"
          >
            A hypothesis, not a promise — the bet we’re here to test.
          </motion.p>
        </section>

        {/* The three layers */}
        <section className="pb-20">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-5"
          >
            The same problem, three layers deep
          </motion.p>

          <div className="space-y-3">
            {layers.map((l, i) => (
              <motion.div
                key={l.depth}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`relative rounded-2xl ${l.bg} px-7 py-7 sm:px-10 sm:py-8`}
                style={{ marginLeft: `${i * 1.5}rem` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div className="max-w-2xl">
                    <div className={`text-[10px] tracking-[0.3em] uppercase ${l.tag} mb-2`}>
                      {l.depth} · {l.actor}
                    </div>
                    <div className={`text-2xl sm:text-3xl font-light ${l.text} leading-snug`}>
                      {l.line}
                    </div>
                    <p className={`mt-3 text-sm sm:text-[15px] font-light leading-relaxed ${l.sub}`}>
                      {l.detail}
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <div className={`text-3xl sm:text-4xl font-light ${l.text} tabular-nums`}>
                      {l.stat}
                    </div>
                    <div className={`text-[11px] font-light leading-tight mt-1 max-w-[12rem] ${l.sub}`}>
                      {l.statLabel}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 text-lg sm:text-xl text-teal-700 italic font-light max-w-3xl"
          >
            Mental health care is episodic by design. We make it continuous.
          </motion.p>
        </section>

        {/* How big — France, Europe, World */}
        <section className="py-14 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-6"
          >
            How big — France · Europe · World
          </motion.p>

          <div className="space-y-3">
            {scaleLayers.map((s, i) => (
              <motion.div
                key={s.region}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`rounded-2xl px-7 py-6 sm:px-10 sm:py-7 ${s.bg}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="sm:w-44 shrink-0">
                    <div className={`text-base tracking-[0.2em] uppercase font-medium ${s.text}`}>{s.region}</div>
                    <div className={`text-[11px] font-light mt-1 ${s.sub}`}>{s.note}</div>
                  </div>
                  <div className="flex flex-wrap gap-x-10 gap-y-4">
                    {s.stats.map((st, j) => (
                      <div key={j} className="min-w-[5rem]">
                        <div className={`text-2xl sm:text-3xl font-light tabular-nums leading-none ${s.text}`}>{st.v}</div>
                        <div className={`mt-1.5 text-[11px] font-light leading-tight max-w-[11rem] ${s.sub}`}>{st.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`mt-4 text-[10px] uppercase tracking-wider ${s.sub} flex flex-wrap gap-x-3 gap-y-1`}>
                  {s.src.map((src, k) => (
                    <a
                      key={k}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-dotted underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                      {src.label} ↗
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Where we go */}
        <section className="py-14 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-8"
          >
            Where it goes — the problem solved at scale
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {horizons.map((h, i) => (
              <motion.div
                key={h.tag}
                initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-2">{h.tag}</div>
                <div className={`text-xl font-medium ${h.accent} mb-2`}>{h.title}</div>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">{h.body}</p>
                <p className="mt-3 text-xs text-neutral-400 font-light">{h.who}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* The far horizon — Intelligence / the spine */}
        <section className="py-14 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.5 }}
            className="text-[11px] tracking-[0.3em] uppercase text-neutral-400 mb-6"
          >
            The far horizon — the intelligence
          </motion.p>
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl mb-10"
          >
            Two kinds of data almost no one has — together.
          </motion.h2>

          {/* The merge → the spine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-teal-50 px-7 py-6"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-teal-600 mb-2">From therapists</div>
              <div className="text-lg font-medium text-teal-900">The <span className="italic">why</span></div>
              <p className="mt-2 text-sm font-light text-teal-700/80 leading-relaxed">
                The clinical reading of what's really going on — the expert interpretation no app has.
              </p>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-teal-50 px-7 py-6"
            >
              <div className="text-[10px] tracking-[0.25em] uppercase text-teal-600 mb-2">From patients</div>
              <div className="text-lg font-medium text-teal-900">The <span className="italic">what</span></div>
              <p className="mt-2 text-sm font-light text-teal-700/80 leading-relaxed">
                The real patterns — moods, behaviour, how a person moves over time.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl bg-neutral-900 px-7 py-8 sm:px-10"
          >
            <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-2">The spine</div>
            <div className="text-xl sm:text-2xl font-light text-white leading-snug">
              A model of why people do what they do — interpreted by clinicians, not guessed from clicks.
            </div>
          </motion.div>

          {/* The personalization layer */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10"
          >
            <p className="text-base text-neutral-900 font-light max-w-3xl mb-5">
              <span className="font-medium">"Sign in with Google"</span> gave every app an identity layer.
              <span className="font-medium"> Bloomsline</span> gives every app an <span className="font-medium">understanding</span> layer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-200 px-7 py-6">
                <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-2">Today</div>
                <p className="text-sm font-light text-neutral-600 leading-relaxed">
                  Every app collects years of your data to personalise — Netflix, Spotify, all of them start cold.
                </p>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 px-7 py-6">
                <div className="text-[10px] tracking-[0.25em] uppercase text-teal-600 mb-2">With Bloomsline</div>
                <p className="text-sm font-light text-teal-800 leading-relaxed">
                  A 4–5 question intake → day-one personalisation. Anonymous. No data stored on their side. They plug in; the understanding lives with us.
                </p>
              </div>
            </div>

            {/* Live mockup of the understanding layer in action */}
            <div className="mt-12 flex justify-center">
              <PersonalizationDemo />
            </div>
          </motion.div>

          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-sm text-neutral-400 font-light italic max-w-3xl"
          >
            Earned, not assumed — the spine only exists once we've won the practitioner layer. Step one is continuity.
          </motion.p>
        </section>

        {/* Close */}
        <section className="py-20 border-t border-neutral-200">
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl font-light text-neutral-900 leading-snug max-w-3xl"
          >
            We don’t need the world. We need to make care continuous —
            <span className="text-teal-700"> one practitioner at a time.</span>
          </motion.p>
        </section>

      </div>
    </div>
  )
}

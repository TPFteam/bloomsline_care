'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, Mail, Linkedin, MessageCircle, Calendar, Quote, FlaskConical, Users, HelpCircle, Lightbulb, Sparkles } from 'lucide-react'

const SLIDES = 8

export default function AppeaPresentation() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrent(c => Math.min(c + 1, SLIDES - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleDownload = () => window.print()

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .slide-wrapper { display: block !important; }
          .slide {
            display: flex !important;
            page-break-after: always !important;
            break-after: page !important;
            width: 100vw !important;
            height: 100vh !important;
            min-height: 100vh !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .slide:last-child { page-break-after: auto !important; }
        }
        @media screen {
          .slide-wrapper > .slide:not(.active) { display: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Bloomsline · APPEA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">{current + 1} / {SLIDES}</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>

      {/* Slides */}
      <div className="slide-wrapper pt-20 pb-24 px-4 md:px-12">
        {/* Slide 1 — Cover */}
        <Slide active={current === 0} index={0}>
          <div className="grid grid-cols-1 md:grid-cols-5 h-full bg-gradient-to-br from-stone-50 via-white to-emerald-50 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-200/40 to-emerald-300/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-br from-emerald-200/30 to-teal-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            {/* Left content */}
            <div className="relative md:col-span-3 flex flex-col justify-between p-10 md:p-14">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900 text-lg">Bloomsline</span>
              </div>

              <div className="space-y-5 max-w-2xl">
                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold tracking-wide">
                  Pour les formateurs et psychologues de l&apos;APPEA
                </span>
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
                  Suivi inter-séances en clinique :
                  <span className="block mt-2 text-teal-700">pertinence pour l&apos;enfant et l&apos;adolescent ?</span>
                </h1>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  Une démarche de recherche clinique qui interroge la continuité du travail thérapeutique entre les séances dans le champ de l&apos;enfance et de l&apos;adolescence.
                </p>
                <div className="h-1 w-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4 pt-6 border-t border-gray-200/70">
                <div>
                  <p className="text-base font-semibold text-gray-900">Sarah Lagzouli</p>
                  <p className="text-xs text-gray-500 mt-0.5">Co-fondatrice · Bloomsline</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                    <a href="mailto:sarah.lagzouli@gmail.com" className="flex items-center gap-1 hover:text-teal-700">
                      <Mail className="w-3 h-3" /> sarah.lagzouli@gmail.com
                    </a>
                    <a href="https://www.linkedin.com/in/sarah-lagzouli/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-teal-700">
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </a>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Mai 2026</p>
              </div>
            </div>

            {/* Right — Sommaire */}
            <div className="hidden md:flex md:col-span-2 relative bg-white/60 backdrop-blur-sm border-l border-gray-200/60 p-10 flex-col justify-center">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-widest mb-5">Sommaire</p>
              <ol className="space-y-3 text-sm">
                {[
                  'Ce qui m\'amène vers vous',
                  'Constats cliniques',
                  'Vision en une phrase',
                  'Premiers entretiens',
                  'La question posée',
                  'Hypothèses',
                  'Échangeons',
                ].map((title, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-gray-700">
                    <span className="text-xs font-mono text-teal-600 w-5 shrink-0">{String(i + 2).padStart(2, '0')}</span>
                    <span className="leading-snug">{title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Slide>

        {/* Slide 2 — Ce qui m'amène vers vous */}
        <Slide active={current === 1} index={1}>
          <div className="flex flex-col h-full p-12 md:p-20">
            <SlideTitle icon={Lightbulb} eyebrow="Démarche" title="Ce qui m'amène vers vous" />
            <div className="flex-1 flex flex-col justify-center max-w-4xl space-y-6 text-lg leading-relaxed text-gray-700">
              <p>
                J&apos;étudie une approche de suivi inter-séances qui permet aux patients de
                <span className="font-semibold text-gray-900"> prolonger le travail thérapeutique entre les séances</span>,
                et au praticien de suivre les évolutions et régressions en temps réel.
              </p>
              <p>
                Après une première phase de validation auprès de praticiens travaillant avec des adultes,
                je souhaite aujourd&apos;hui questionner sa pertinence dans le champ de
                <span className="font-semibold text-gray-900"> la psychologie et de la psychopathologie de l&apos;enfant et de l&apos;adolescent</span>.
              </p>
              <p>
                L&apos;APPEA réunit des psychologues spécialisés dans ce champ, issus de différentes orientations cliniques.
                C&apos;est précisément ce <span className="font-semibold text-gray-900">regard pluriel et exigeant</span> que je sollicite.
              </p>
            </div>
          </div>
        </Slide>

        {/* Slide 3 — Constats cliniques */}
        <Slide active={current === 2} index={2}>
          <div className="flex flex-col h-full p-12 md:p-16">
            <SlideTitle icon={Quote} eyebrow="Observations" title="Les constats cliniques de départ" subtitle="Issus d'entretiens avec des praticiens" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <ConstatCard
                quote="Quand je reviens en séance, j'ai oublié ce que je voulais dire"
                interpretation="Le matériel émerge entre les séances mais peut se perdre avant de pouvoir être travaillé"
              />
              <ConstatCard
                quote="Elle m'a confondu avec une autre patiente — Elle m'a reposé la même question"
                interpretation="Sentiment d'être un dossier parmi d'autres, fragilisation du lien thérapeutique"
              />
              <ConstatCard
                quote="ChatGPT m'aide dans ma thérapie"
                interpretation="L'utilisation de l'IA pour prolonger la thérapie est source de mentalisation, d'absence d'intégration et d'activation émotionnelle non contenue sans cadre"
              />
              <ConstatCard
                quote="J'ai arrêté la thérapie parce que je n'ai pas vu de résultats"
                interpretation="Ce qui constitue une évolution (inconfort, silences, oublis) est assimilé comme un échec par le patient"
              />
            </div>
          </div>
        </Slide>

        {/* Slide 4 — En une phrase */}
        <Slide active={current === 3} index={3}>
          <div className="flex flex-col h-full justify-center items-center p-12 md:p-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <p className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-12">En une phrase</p>
            <blockquote className="text-3xl md:text-5xl font-semibold text-gray-900 leading-snug max-w-5xl text-center tracking-tight">
              «&nbsp;Soutenir la <span className="text-teal-700">continuité du travail thérapeutique</span> entre les séances.
              <span className="block mt-4 text-2xl md:text-3xl font-normal text-gray-600">
                Sans alourdir le quotidien du praticien et sans intrusion pour le patient.&nbsp;»
              </span>
            </blockquote>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mt-12" />
          </div>
        </Slide>

        {/* Slide 5 — Premiers entretiens */}
        <Slide active={current === 4} index={4}>
          <div className="flex flex-col h-full p-12 md:p-20">
            <SlideTitle icon={Users} eyebrow="État actuel" title="Ce que les premiers entretiens ont permis d'éclairer" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Périmètre</p>
                <p className="text-3xl font-bold text-gray-900">10</p>
                <p className="text-gray-600 leading-relaxed text-sm">
                  échanges avec des psychologues d&apos;orientations variées : <strong>intégrative, TCC, systémique, psychanalyse</strong>,
                  incluant des superviseurs et formateurs.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Trois axes de retour</p>
                <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
                  <li className="flex gap-2"><span className="text-teal-600">•</span> Facilité d&apos;usage</li>
                  <li className="flex gap-2"><span className="text-teal-600">•</span> Qualité du lien thérapeutique</li>
                  <li className="flex gap-2"><span className="text-teal-600">•</span> Structuration du suivi</li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                <p className="text-gray-800 leading-relaxed text-sm">
                  <strong>Plusieurs praticiens utilisent aujourd&apos;hui cette approche</strong> dans leur pratique quotidienne.
                </p>
              </div>
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                <p className="text-gray-800 leading-relaxed text-sm">
                  <strong>Limite actuelle :</strong> les retours portent essentiellement sur la pratique avec des adultes.
                </p>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 6 — Question */}
        <Slide active={current === 5} index={5}>
          <div className="flex flex-col h-full justify-center p-12 md:p-20 bg-gradient-to-br from-stone-50 to-emerald-50">
            <p className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-8 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> La question que je vous pose
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight max-w-5xl tracking-tight">
              Cette logique de continuité inter-séances peut-elle s&apos;inscrire avec
              <span className="text-teal-700"> pertinence dans la clinique de l&apos;enfant et de l&apos;adolescent</span> ?
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-base text-gray-700 font-medium">À quelles conditions ?</span>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-base text-gray-700 font-medium">Avec quelles adaptations ?</span>
            </div>
          </div>
        </Slide>

        {/* Slide 7 — Hypothèses */}
        <Slide active={current === 6} index={6}>
          <div className="flex flex-col h-full p-12 md:p-16">
            <SlideTitle icon={FlaskConical} eyebrow="Pistes de réflexion" title="Hypothèses" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
              <HypothesisCard
                num="1"
                premise="Le matériel se perd entre les séances chez l'adulte."
                question="L'enfant et l'adolescent, plus à l'aise avec le digital, pourraient-ils s'approprier plus naturellement un outil de suivi entre les séances ?"
              />
              <HypothesisCard
                num="2"
                premise="Le lien thérapeutique se fragilise quand la charge cognitive du suivi s'accentue dans la durée."
                question="Cet enjeu est-il plus aigu chez les plus jeunes, particulièrement à l'adolescence où la fiabilité de l'adulte est centrale ?"
              />
              <HypothesisCard
                num="3"
                premise="L'IA conversationnelle s'invite déjà dans le parcours thérapeutique des adultes."
                question="Qu'en est-il chez les enfants et adolescents ? Comment leur offrir un cadre éthique qui soutient le travail sans les exposer ?"
              />
            </div>
          </div>
        </Slide>

        {/* Slide 8 — Échangeons */}
        <Slide active={current === 7} index={7}>
          <div className="flex flex-col h-full p-12 md:p-20 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
            <SlideTitle icon={MessageCircle} eyebrow="Suite" title="Échangeons" />
            <p className="text-lg text-gray-700 mb-8 max-w-3xl">
              Si cette démarche vous parle, voici comment poursuivre :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              <a
                href="https://calendly.com/sarah-lagzouli/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-8 text-white hover:scale-[1.02] transition-transform shadow-xl"
              >
                <Calendar className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Réservez un échange en visio</h3>
                <p className="text-teal-100 text-sm leading-relaxed">
                  Pour discuter de votre pratique et explorer ensemble la pertinence de cette approche.
                </p>
                <p className="text-white/80 text-xs mt-4 underline group-hover:no-underline">calendly.com/sarah-lagzouli/30min</p>
              </a>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ou contactez-moi par message</h3>
                <a href="https://wa.me/?text=Bonjour%20Sarah" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-teal-700 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
                <a href="mailto:sarah.lagzouli@gmail.com" className="flex items-center gap-3 text-gray-700 hover:text-teal-700 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium">sarah.lagzouli@gmail.com</span>
                </a>
                <a href="https://www.linkedin.com/in/sarah-lagzouli/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-teal-700 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>
              </div>
            </div>
            <div className="mt-auto flex items-center gap-3 text-xs text-gray-400">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              Bloomsline
            </div>
          </div>
        </Slide>
      </div>

      {/* Bottom navigation */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrent(c => Math.max(c - 1, 0))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-teal-600' : 'w-1.5 bg-gray-300 hover:bg-gray-400'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent(c => Math.min(c + 1, SLIDES - 1))}
          disabled={current === SLIDES - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function Slide({ active, children }: { active: boolean; index: number; children: React.ReactNode }) {
  return (
    <div
      className={`slide ${active ? 'active' : ''} bg-white rounded-3xl shadow-xl border border-gray-200 mx-auto overflow-hidden`}
      style={{ width: '100%', maxWidth: 1200, aspectRatio: '16 / 9', minHeight: 600 }}
    >
      {children}
    </div>
  )
}

function SlideTitle({ icon: Icon, eyebrow, title, subtitle }: { icon: React.ElementType; eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {eyebrow}
      </p>
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
    </div>
  )
}

function ConstatCard({ quote, interpretation }: { quote: string; interpretation: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <Quote className="w-4 h-4 text-teal-600 shrink-0 mt-1" />
        <p className="text-gray-900 italic font-medium leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </div>
      <div className="pl-6 border-l-2 border-teal-200">
        <p className="text-gray-600 text-sm leading-relaxed">{interpretation}</p>
      </div>
    </div>
  )
}

function HypothesisCard({ num, premise, question }: { num: string; premise: string; question: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-bold text-base">
        {num}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{premise}</p>
      <p className="text-gray-900 font-semibold text-sm leading-relaxed border-t border-gray-100 pt-3 mt-auto">
        {question}
      </p>
    </div>
  )
}

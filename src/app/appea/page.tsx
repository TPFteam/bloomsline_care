'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2, Mail, Linkedin, MessageCircle, Calendar } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const SLIDES = 8

export default function AppeaPresentation() {
  const [current, setCurrent] = useState(0)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrent(c => Math.min(c + 1, SLIDES - 1))
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleDownload = async () => {
    setGenerating(true)
    const startSlide = current
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])

      const PAGE_W = 338.67
      const PAGE_H = 190.5
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PAGE_W, PAGE_H] })

      for (let i = 0; i < SLIDES; i++) {
        // Switch to this slide and wait for React render
        setCurrent(i)
        await new Promise(r => setTimeout(r, 200))

        // Capture the now-visible active slide
        const slideEl = document.querySelector('.slide.active') as HTMLElement | null
        if (!slideEl) continue

        // Strip card chrome (border, rounded corners, shadow) for full-bleed PDF
        const originalStyle = slideEl.getAttribute('style') || ''
        slideEl.setAttribute(
          'style',
          `${originalStyle}; border: none !important; border-radius: 0 !important; box-shadow: none !important;`
        )
        await new Promise(r => requestAnimationFrame(() => r(null)))

        const canvas = await html2canvas(slideEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        })

        // Capture link positions BEFORE restoring style
        const slideRect = slideEl.getBoundingClientRect()
        const scaleX = PAGE_W / slideRect.width
        const scaleY = PAGE_H / slideRect.height
        const linkRects: { x: number; y: number; w: number; h: number; url: string }[] = []
        slideEl.querySelectorAll('a[href]').forEach(a => {
          const href = (a as HTMLAnchorElement).href
          if (!href || href.startsWith('javascript:')) return
          const r = a.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return
          linkRects.push({
            x: (r.left - slideRect.left) * scaleX,
            y: (r.top - slideRect.top) * scaleY,
            w: r.width * scaleX,
            h: r.height * scaleY,
            url: href,
          })
        })

        slideEl.setAttribute('style', originalStyle)

        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'landscape')
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST')

        // Add clickable link annotations on this page
        linkRects.forEach(l => pdf.link(l.x, l.y, l.w, l.h, { url: l.url }))
      }

      pdf.save('Bloomsline-APPEA.pdf')
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed.')
    } finally {
      setCurrent(startSlide)
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
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
          }
          .slide:last-child { page-break-after: auto !important; }
        }
        @media screen {
          .slide-wrapper > .slide:not(.active) { display: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Logo size="sm" showText />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">{current + 1} / {SLIDES}</span>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      <div className="slide-wrapper pt-20 pb-24 px-4 md:px-12">
        {/* Slide 1 — Couverture */}
        <Slide active={current === 0}>
          <div className="flex flex-col h-full p-12 md:p-16 bg-gradient-to-br from-stone-50 via-white to-emerald-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-teal-200/40 to-emerald-300/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-br from-emerald-200/30 to-teal-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="relative flex-1 flex flex-col justify-center max-w-4xl">
              <p className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-6">
                Présentation à l&apos;attention des psychologues membres de l&apos;APPEA
              </p>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                Suivi inter-séances en clinique :
                <span className="block mt-3 text-teal-700">pertinence pour l&apos;enfant et l&apos;adolescent ?</span>
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mt-8" />
            </div>

            <div className="relative flex flex-wrap items-end justify-between gap-6 pt-6 border-t border-gray-200/70">
              <div>
                <p className="text-xl font-semibold text-gray-900">Sarah Lagzouli</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <a href="mailto:sarah.lagzouli@gmail.com" className="flex items-center gap-1.5 hover:text-teal-700">
                    <Mail className="w-3.5 h-3.5" /> sarah.lagzouli@gmail.com
                  </a>
                  <a href="https://wa.me/33671482004" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-700">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <a href="https://www.linkedin.com/in/sarah-lagzouli/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-700">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <p className="text-sm text-gray-400">Mai 2026</p>
                <Logo size="xs" showText />
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 2 — Ce qui m'amène vers vous */}
        <Slide active={current === 1}>
          <div className="flex flex-col h-full p-12 md:p-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-10">
              Ce qui m&apos;amène vers vous
            </h2>
            <ul className="flex-1 max-w-4xl space-y-6 text-lg leading-relaxed text-gray-800 list-disc pl-6 marker:text-teal-600">
              <li>
                J&apos;étudie une approche de suivi inter-séances qui permet aux patients de prolonger le travail thérapeutique entre les séances, et au praticien de suivre les évolutions et régressions en temps réel.
              </li>
              <li>
                Après une première phase de validation auprès de praticiens travaillant avec des adultes, je souhaite aujourd&apos;hui questionner sa pertinence dans le champ de la psychologie et de la psychopathologie de l&apos;enfant et de l&apos;adolescent.
              </li>
              <li>
                L&apos;APPEA réunit des psychologues spécialisés dans ce champ, issus de différentes orientations cliniques. C&apos;est précisément ce regard pluriel et exigeant que je sollicite.
              </li>
            </ul>
          </div>
        </Slide>

        {/* Slide 3 — Les constats cliniques de départ issus d'entretiens */}
        <Slide active={current === 2}>
          <div className="flex flex-col h-full p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-6">
              Les constats cliniques de départ issus d&apos;entretiens
            </h2>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConstatCard
                quote="Quand je reviens en séance, j'ai oublié ce que je voulais dire"
                arrow="le matériel émerge entre les séances mais peut se perdre avant de pouvoir être travaillé"
              />
              <ConstatCard
                quote={`Elle m'a confondu avec une autre patiente", "Elle m'a reposé la même question`}
                arrow="sentiment d'être un dossier parmi d'autres, fragilisation du lien thérapeutique"
              />
              <ConstatCard
                quote="ChatGPT m'aide dans ma thérapie"
                arrow="l'utilisation de l'IA pour prolonger la thérapie est source de mentalisation, d'absence d'intégration et d'activation émotionnelle non contenue sans cadre"
              />
              <ConstatCard
                quote="J'ai arrêté la thérapie parce que je n'ai pas vu de résultats"
                arrow="ce qui constitue une évolution (inconfort, silences, oublis) est assimilé comme un échec par le patient"
              />
            </div>
          </div>
        </Slide>

        {/* Slide 4 — En une phrase */}
        <Slide active={current === 3}>
          <div className="flex flex-col h-full justify-center items-center p-12 md:p-20 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <h2 className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-12">
              En une phrase
            </h2>
            <blockquote className="text-3xl md:text-5xl font-semibold text-gray-900 leading-snug max-w-5xl text-center tracking-tight">
              Soutenir la <span className="text-teal-700">continuité du travail thérapeutique</span> entre les séances.
              <span className="block mt-4">
                Sans alourdir le quotidien du praticien et sans intrusion pour le patient.
              </span>
            </blockquote>
            <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mt-12" />
          </div>
        </Slide>

        {/* Slide 5 — Ce que les premiers entretiens ont permis d'éclairer */}
        <Slide active={current === 4}>
          <div className="flex flex-col h-full p-12 md:p-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-10">
              Ce que les premiers entretiens ont permis d&apos;éclairer
            </h2>
            <ul className="flex-1 max-w-4xl space-y-5 text-lg leading-relaxed text-gray-800 list-disc pl-6 marker:text-teal-600">
              <li>
                Dix échanges avec des psychologues d&apos;orientations variées (intégrative, TCC, systémique, psychanalyse), incluant des superviseurs et des formateurs.
              </li>
              <li>
                Trois axes de retour&nbsp;: facilité d&apos;usage, qualité du lien thérapeutique, structuration du suivi.
              </li>
              <li>
                Plusieurs praticiens utilisent aujourd&apos;hui cette approche dans leur pratique quotidienne.
              </li>
              <li>
                Les retours actuels portent essentiellement sur la pratique avec des adultes.
              </li>
            </ul>
          </div>
        </Slide>

        {/* Slide 6 — La question que je vous pose */}
        <Slide active={current === 5}>
          <div className="flex flex-col h-full justify-center p-12 md:p-20 bg-gradient-to-br from-stone-50 to-emerald-50">
            <h2 className="text-sm font-semibold text-teal-700 uppercase tracking-widest mb-8">
              La question que je vous pose
            </h2>
            <p className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight max-w-5xl tracking-tight">
              Cette logique de continuité inter-séances peut-elle{' '}
              <span className="text-teal-700">s&apos;inscrire avec pertinence dans la clinique de l&apos;enfant et de l&apos;adolescent ?</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-base text-gray-700 font-medium">À quelles conditions ?</span>
              <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-base text-gray-700 font-medium">Avec quelles adaptations ?</span>
            </div>
          </div>
        </Slide>

        {/* Slide 7 — Hypothèses */}
        <Slide active={current === 6}>
          <div className="flex flex-col h-full p-12 md:p-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-10">
              Hypothèses
            </h2>
            <ol className="flex-1 max-w-4xl space-y-7 list-decimal pl-6 marker:text-teal-600 marker:font-semibold marker:text-2xl">
              <li className="space-y-2">
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  Le matériel se perd entre les séances chez l&apos;adulte.
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  L&apos;enfant et l&apos;adolescent, plus à l&apos;aise avec le digital, pourraient-ils s&apos;approprier plus naturellement un outil de suivi entre les séances ?
                </p>
              </li>
              <li className="space-y-2">
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  Le lien thérapeutique se fragilise quand la charge cognitive du suivi s&apos;accentue dans la durée.
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Cet enjeu est-il plus aigu chez les plus jeunes, particulièrement à l&apos;adolescence où la fiabilité de l&apos;adulte est centrale ?
                </p>
              </li>
              <li className="space-y-2">
                <p className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                  Si l&apos;IA conversationnelle s&apos;invite déjà dans le parcours thérapeutique des adultes, qu&apos;en est-il chez les enfants et adolescents ?
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Comment leur offrir un cadre éthique qui soutient le travail sans les exposer ?
                </p>
              </li>
            </ol>
          </div>
        </Slide>

        {/* Slide 8 — Échangeons */}
        <Slide active={current === 7}>
          <div className="flex flex-col h-full p-12 md:p-16 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Échangeons
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-3xl">
              Si cette démarche vous parle, voici comment poursuivre&nbsp;:
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
              <div className="bg-white rounded-2xl p-8 border border-gray-200 relative">
                {/* Sarah photo */}
                <div className="absolute -top-8 right-8 w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sarah.png" alt="Sarah Lagzouli" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ou contactez-moi par message</h3>
                <div className="space-y-4">
                  <a href="https://wa.me/33671482004" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-teal-700 transition-colors">
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
                    <span className="text-sm font-medium">linkedin.com/in/sarah-lagzouli</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-6 flex justify-end">
              <Logo size="xs" showText />
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

function Slide({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`slide ${active ? 'active' : ''} bg-white rounded-3xl shadow-xl border border-gray-200 mx-auto overflow-hidden`}
      style={{ width: '100%', maxWidth: 1200, aspectRatio: '16 / 9', minHeight: 600 }}
    >
      {children}
    </div>
  )
}

function ConstatCard({ quote, arrow }: { quote: string; arrow: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition-shadow">
      <p className="text-gray-900 italic font-medium leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex gap-2 pl-1 border-l-2 border-teal-300">
        <span className="text-teal-600 text-base leading-relaxed pl-2">→</span>
        <p className="text-gray-600 text-sm leading-relaxed">{arrow}</p>
      </div>
    </div>
  )
}


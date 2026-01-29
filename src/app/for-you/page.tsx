'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/ui/logo'
import {
  ChevronDown,
  BookOpen,
  TrendingUp,
  HeartHandshake,
  Footprints,
  Radio,
  BarChart3,
  Clock,
  Shield,
} from 'lucide-react'

/* ─── Member content ─── */

const memberBenefits = [
  {
    icon: BookOpen,
    title: { en: 'Capture your moments', fr: 'Capturez vos moments' },
    desc: {
      en: 'Write down what you\u2019re feeling, when you feel it. No pressure, no judgment.',
      fr: 'Notez ce que vous ressentez, quand vous le ressentez. Sans pression, sans jugement.',
    },
  },
  {
    icon: TrendingUp,
    title: { en: 'See your patterns', fr: 'Voyez vos tendances' },
    desc: {
      en: 'Over time, you\u2019ll start noticing what lifts you up \u2014 and what holds you back.',
      fr: 'Avec le temps, vous remarquerez ce qui vous fait du bien \u2014 et ce qui vous retient.',
    },
  },
  {
    icon: HeartHandshake,
    title: { en: 'A gentle presence', fr: 'Une pr\u00e9sence douce' },
    desc: {
      en: 'Bloomsline is there between sessions \u2014 quiet, patient, always available.',
      fr: 'Bloomsline est l\u00e0 entre les s\u00e9ances \u2014 discret, patient, toujours disponible.',
    },
  },
  {
    icon: Footprints,
    title: { en: 'Small steps forward', fr: 'De petits pas en avant' },
    desc: {
      en: 'Growth doesn\u2019t need to be dramatic. Sometimes it starts with just showing up.',
      fr: 'Grandir n\u2019a pas besoin d\u2019\u00eatre spectaculaire. Parfois, il suffit de se pr\u00e9senter.',
    },
  },
]

const memberContent = {
  headline: {
    en: 'A quiet space to capture how you\u2019re actually doing',
    fr: 'Un espace calme pour noter comment vous allez vraiment',
  },
  pitch: {
    en: 'Bloomsline helps you understand yourself better. Small daily check-ins, meaningful habits, and a closer connection with your practitioner \u2014 all in one quiet space.',
    fr: 'Bloomsline vous aide \u00e0 mieux vous comprendre. De petits bilans quotidiens, des habitudes qui comptent, et un lien plus fort avec votre praticien \u2014 le tout dans un espace calme.',
  },
  scenarios: [
    {
      label: { en: 'Rough day at work', fr: 'Journ\u00e9e difficile au travail' },
      story: {
        en: 'It\u2019s 11 PM. Your chest feels tight and your head won\u2019t stop. You open Bloomsline, write three words: "tight chest, overwhelmed." That\u2019s it. You didn\u2019t fix anything, but you put it somewhere. A few weeks later, you look back and notice \u2014 it\u2019s always Tuesday nights. You never saw that before. Now you can do something about it.',
        fr: 'Il est 23h. La poitrine serr\u00e9e, la t\u00eate qui tourne. Vous ouvrez Bloomsline, \u00e9crivez trois mots\u00a0: \u00ab\u00a0poitrine serr\u00e9e, submerg\u00e9.\u00a0\u00bb C\u2019est tout. Vous n\u2019avez rien r\u00e9gl\u00e9, mais vous l\u2019avez d\u00e9pos\u00e9 quelque part. Quelques semaines plus tard, vous regardez en arri\u00e8re et remarquez \u2014 c\u2019est toujours le mardi soir. Vous ne l\u2019aviez jamais vu. Maintenant, vous pouvez agir.',
      },
    },
    {
      label: { en: 'Fine, but not really', fr: 'Correct, mais pas vraiment' },
      story: {
        en: 'Nothing bad happened today. But something feels off and you can\u2019t name it. You open Bloomsline and note: "okay day, weirdly flat." You do this a few times. After a month, you notice the flat days always come after skipping your morning walk. Nobody told you that. You saw it yourself.',
        fr: 'Rien de grave aujourd\u2019hui. Mais quelque chose cloche, impossible \u00e0 nommer. Vous ouvrez Bloomsline et notez\u00a0: \u00ab\u00a0journ\u00e9e correcte, bizarrement plate.\u00a0\u00bb Vous le faites quelques fois. Apr\u00e8s un mois, vous remarquez que les jours plats arrivent toujours apr\u00e8s avoir saut\u00e9 votre marche du matin. Personne ne vous l\u2019a dit. Vous l\u2019avez vu vous-m\u00eame.',
      },
    },
    {
      label: { en: 'Finding what helps', fr: 'Trouver ce qui aide' },
      story: {
        en: 'You\u2019ve been trying different things \u2014 journaling, meditation, running. But you don\u2019t know what\u2019s actually working. You start noting how you feel after each one. After a few weeks, it\u2019s clear: running doesn\u2019t do much for you, but even 5 minutes of meditation changes your whole evening. You stop guessing and do what works.',
        fr: 'Vous essayez diff\u00e9rentes choses \u2014 \u00e9criture, m\u00e9ditation, course. Mais vous ne savez pas ce qui marche vraiment. Vous commencez \u00e0 noter comment vous vous sentez apr\u00e8s chacune. Apr\u00e8s quelques semaines, c\u2019est clair\u00a0: la course ne fait pas grand-chose, mais m\u00eame 5 minutes de m\u00e9ditation change toute votre soir\u00e9e. Vous arr\u00eatez de deviner et faites ce qui marche.',
      },
    },
  ],
  why: {
    en: 'Because starting over feels like failing \u2014 but it\u2019s not. You just need a place that remembers where you left off.',
    fr: 'Parce que recommencer donne l\u2019impression d\u2019\u00e9chouer \u2014 mais ce n\u2019est pas le cas. Vous avez juste besoin d\u2019un endroit qui se souvient o\u00f9 vous en \u00e9tiez.',
  },
  closing: {
    en: 'You don\u2019t need to be in crisis to deserve support. Bloomsline is for the in-between \u2014 the days that aren\u2019t terrible but aren\u2019t great either. The days that matter most.',
    fr: 'Vous n\u2019avez pas besoin d\u2019\u00eatre en crise pour m\u00e9riter du soutien. Bloomsline est fait pour l\u2019entre-deux \u2014 les jours qui ne sont ni terribles ni g\u00e9niaux. Les jours qui comptent le plus.',
  },
}

/* ─── Practitioner content ─── */

const practitionerBenefits = [
  {
    icon: Radio,
    title: { en: 'Organize your clients', fr: 'Organisez vos clients' },
    desc: {
      en: 'All your clients in one place. Notes, history, shared resources \u2014 nothing gets lost.',
      fr: 'Tous vos clients au m\u00eame endroit. Notes, historique, ressources partag\u00e9es \u2014 rien ne se perd.',
    },
  },
  {
    icon: BarChart3,
    title: { en: 'Share resources easily', fr: 'Partagez vos ressources facilement' },
    desc: {
      en: 'Send exercises, worksheets, or content directly to your clients. They see it in their own space.',
      fr: 'Envoyez des exercices, des fiches ou du contenu directement \u00e0 vos clients. Ils le voient dans leur propre espace.',
    },
  },
  {
    icon: Clock,
    title: { en: 'Less admin, more focus', fr: 'Moins d\u2019admin, plus de focus' },
    desc: {
      en: 'Stop juggling tools. Notes, scheduling, resources \u2014 it\u2019s all here.',
      fr: 'Arr\u00eatez de jongler entre les outils. Notes, planification, ressources \u2014 tout est ici.',
    },
  },
  {
    icon: Shield,
    title: { en: 'Your clients get their own space', fr: 'Vos clients ont leur propre espace' },
    desc: {
      en: 'They can check in, access what you\u2019ve shared, and follow guided exercises \u2014 on their own time.',
      fr: 'Ils peuvent s\u2019enregistrer, acc\u00e9der \u00e0 ce que vous avez partag\u00e9 et suivre des exercices guid\u00e9s \u2014 \u00e0 leur rythme.',
    },
  },
]

const practitionerContent = {
  headline: {
    en: 'Everything you need, in one place',
    fr: 'Tout ce qu\u2019il vous faut, au m\u00eame endroit',
  },
  pitch: {
    en: 'Bloomsline keeps everything in one place \u2014 your notes, your clients, your resources. Nothing falls through the cracks. You share what you need to share, you find what you need to find, and the admin work stays out of your way.',
    fr: 'Bloomsline garde tout au m\u00eame endroit \u2014 vos notes, vos clients, vos ressources. Rien ne passe entre les mailles. Vous partagez ce que vous devez partager, vous trouvez ce que vous cherchez, et l\u2019administratif ne vous ralentit plus.',
  },
  scenarios: [
    {
      label: { en: 'Before a session', fr: 'Avant une s\u00e9ance' },
      story: {
        en: 'You have a session with Marc in 10 minutes. Before Bloomsline, you\u2019d scramble through emails and Google Docs trying to remember what you sent him. Now you open his profile. His notes are there. The breathing exercise you shared last week is there. His check-ins from the past two weeks are there. You walk in ready.',
        fr: 'Vous avez une s\u00e9ance avec Marc dans 10 minutes. Avant Bloomsline, vous fouilleriez dans vos courriels et Google Docs pour retrouver ce que vous lui avez envoy\u00e9. Maintenant, vous ouvrez son profil. Ses notes sont l\u00e0. L\u2019exercice de respiration que vous avez partag\u00e9 la semaine derni\u00e8re est l\u00e0. Ses enregistrements des deux derni\u00e8res semaines sont l\u00e0. Vous arrivez pr\u00eat.',
      },
    },
    {
      label: { en: 'Sharing a resource', fr: 'Partager une ressource' },
      story: {
        en: 'A client mentions trouble sleeping. You have a great sleep hygiene worksheet. Before, you\u2019d email it, hope they open it, then forget you sent it. Now you share it in Bloomsline. It shows up in their space. You can see if they opened it. Next session, you don\u2019t have to ask "did you get that PDF I sent?"',
        fr: 'Un client mentionne des probl\u00e8mes de sommeil. Vous avez une excellente fiche sur l\u2019hygi\u00e8ne du sommeil. Avant, vous l\u2019envoyiez par courriel, en esp\u00e9rant qu\u2019il l\u2019ouvre, puis vous oubliiez. Maintenant, vous la partagez dans Bloomsline. Elle appara\u00eet dans son espace. Vous voyez s\u2019il l\u2019a ouverte. \u00c0 la prochaine s\u00e9ance, pas besoin de demander \u00ab\u00a0avez-vous re\u00e7u le PDF\u00a0?\u00a0\u00bb',
      },
    },
    {
      label: { en: 'End of a long day', fr: 'Fin d\u2019une longue journ\u00e9e' },
      story: {
        en: 'You saw 8 clients today. You need to write notes for each before you forget. Before, that meant scattered documents and 45 minutes of admin. Now you jot notes in Bloomsline right after each session. They\u2019re attached to the client, next to the resources and history. Tomorrow, you pick up exactly where you left off.',
        fr: 'Vous avez vu 8 clients aujourd\u2019hui. Vous devez r\u00e9diger des notes pour chacun avant d\u2019oublier. Avant, \u00e7a signifiait des documents \u00e9parpill\u00e9s et 45 minutes d\u2019admin. Maintenant, vous notez dans Bloomsline juste apr\u00e8s chaque s\u00e9ance. Les notes sont attach\u00e9es au client, \u00e0 c\u00f4t\u00e9 des ressources et de l\u2019historique. Demain, vous reprenez exactement o\u00f9 vous en \u00e9tiez.',
      },
    },
  ],
  why: {
    en: 'Because your job is to help people \u2014 not to chase notes, dig through files, or wonder where you saved that resource. And your clients get their own space too \u2014 a place to check in, access the resources you share, follow guided exercises, and stay connected to their journey with you.',
    fr: 'Parce que votre travail, c\u2019est d\u2019aider les gens \u2014 pas de courir apr\u00e8s vos notes, fouiller dans vos dossiers ou chercher o\u00f9 vous avez mis cette ressource. Et vos clients ont aussi leur propre espace \u2014 un endroit pour s\u2019enregistrer, acc\u00e9der aux ressources que vous partagez, suivre des exercices guid\u00e9s et rester connect\u00e9s \u00e0 leur parcours avec vous.',
  },
  shift: {
    today: {
      en: 'Practitioners consistently report spending a significant amount of time on administrative tasks \u2014 and it\u2019s a major source of burnout. Notes scattered across tools. Remembering what you shared with who. Scheduling back and forth. Digging through files before a session. You\u2019re part therapist, part secretary, part librarian.',
      fr: 'Les praticiens rapportent syst\u00e9matiquement passer un temps consid\u00e9rable sur des t\u00e2ches administratives \u2014 et c\u2019est une cause majeure d\u2019\u00e9puisement. Des notes \u00e9parpill\u00e9es entre les outils. Se souvenir de ce qu\u2019on a partag\u00e9 avec qui. La planification dans tous les sens. Fouiller dans les dossiers avant une s\u00e9ance. Vous \u00eates \u00e0 la fois th\u00e9rapeute, secr\u00e9taire et biblioth\u00e9caire.',
    },
    future: {
      en: 'The practitioner becomes a guide, not a manager. You focus on the human side \u2014 listening, deciding what matters, choosing the right approach. The tool handles the remembering, organizing, and delivering. Notes don\u2019t get lost. Resources reach the client without a follow-up email. The client has a space to do work on their own between sessions.',
      fr: 'Le praticien devient un guide, pas un gestionnaire. Vous vous concentrez sur l\u2019humain \u2014 \u00e9couter, d\u00e9cider de ce qui compte, choisir la bonne approche. L\u2019outil s\u2019occupe de retenir, organiser et transmettre. Les notes ne se perdent plus. Les ressources arrivent au client sans courriel de suivi. Le client a un espace pour travailler par lui-m\u00eame entre les s\u00e9ances.',
    },
    bloomsline: {
      en: 'Bloomsline doesn\u2019t replace the practitioner. It takes the stuff you\u2019re bad at \u2014 not because you lack skill, but because it\u2019s not your job \u2014 and handles it. So when you sit down with a client, you\u2019re not catching up. You\u2019re already there.',
      fr: 'Bloomsline ne remplace pas le praticien. Il prend en charge ce dans quoi vous n\u2019\u00eates pas bon \u2014 non pas par manque de comp\u00e9tence, mais parce que ce n\u2019est pas votre travail \u2014 et s\u2019en occupe. Quand vous vous asseyez avec un client, vous ne rattrapez pas le retard. Vous \u00eates d\u00e9j\u00e0 l\u00e0.',
    },
    bridge: {
      en: 'Today you manage everything. Tomorrow you focus on what matters. Bloomsline handles the rest.',
      fr: 'Aujourd\u2019hui, vous g\u00e9rez tout. Demain, vous vous concentrez sur ce qui compte. Bloomsline s\u2019occupe du reste.',
    },
  },
  closing: {
    en: 'You became a practitioner to make a difference. Bloomsline helps you do that \u2014 without burning out.',
    fr: 'Vous \u00eates devenu praticien pour faire une diff\u00e9rence. Bloomsline vous aide \u00e0 y parvenir \u2014 sans vous \u00e9puiser.',
  },
}

/* ─── Shared types ─── */

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>
  title: { en: string; fr: string }
  desc: { en: string; fr: string }
}

interface Scenario {
  label: { en: string; fr: string }
  story: { en: string; fr: string }
}

interface BlockContent {
  headline: { en: string; fr: string }
  pitch: { en: string; fr: string }
  scenarios: Scenario[]
  why: { en: string; fr: string }
  shift?: {
    today: { en: string; fr: string }
    future: { en: string; fr: string }
    bloomsline: { en: string; fr: string }
    bridge: { en: string; fr: string }
  }
  closing: { en: string; fr: string }
}

/* ─── Expandable sub-row ─── */

function SubRow({
  title,
  chevronColor,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  chevronColor: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-neutral-200/60">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-neutral-700">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className={`w-4 h-4 ${chevronColor}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Nested shift row ─── */

function ShiftRow({
  title,
  chevronColor,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  chevronColor: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-neutral-200/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
      >
        <span className="text-xs uppercase tracking-wider text-neutral-400">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-3.5 h-3.5 ${chevronColor}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Expandable pitch block ─── */

function PitchBlock({
  label,
  accent,
  benefits,
  content,
  isOpen,
  onToggle,
  locale,
}: {
  label: { en: string; fr: string }
  accent: 'teal' | 'coral'
  benefits: BenefitItem[]
  content: BlockContent
  isOpen: boolean
  onToggle: () => void
  locale: string
}) {
  const t = (obj: { en: string; fr: string }) => (locale === 'fr' ? obj.fr : obj.en)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const [openShift, setOpenShift] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState(0)

  const toggleSub = (key: string) => {
    setOpenSub(openSub === key ? null : key)
  }

  const toggleShift = (key: string) => {
    setOpenShift(openShift === key ? null : key)
  }

  const accentStyles = {
    teal: {
      border: 'border-teal-200',
      borderOpen: 'border-teal-300',
      bg: 'bg-teal-50/40',
      label: 'text-teal-600',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      cardBg: 'bg-teal-50/60',
      cardBorder: 'border-teal-100/60',
      chevron: 'text-teal-400',
    },
    coral: {
      border: 'border-[#E8A87C]/30',
      borderOpen: 'border-[#D4856A]/40',
      bg: 'bg-[#D4856A]/5',
      label: 'text-[#D4856A]',
      iconBg: 'bg-[#D4856A]/10',
      iconColor: 'text-[#D4856A]',
      cardBg: 'bg-[#D4856A]/5',
      cardBorder: 'border-[#D4856A]/10',
      chevron: 'text-[#D4856A]/50',
    },
  }

  const s = accentStyles[accent]

  const subLabels = {
    pitch: { en: 'The pitch', fr: 'Le pitch' },
    scenarios: { en: 'Pick a scenario', fr: 'Choisissez un sc\u00e9nario' },
    why: { en: 'Why it exists', fr: 'Pourquoi ça existe' },
    benefits: { en: 'What it does', fr: 'Ce que ça fait' },
    shift: { en: 'The shift', fr: 'Le changement' },
    closing: { en: 'What it means', fr: 'Ce que ça signifie' },
  }

  return (
    <div
      className={`rounded-2xl border transition-colors duration-300 ${
        isOpen ? `${s.borderOpen} ${s.bg}` : `${s.border} bg-white`
      }`}
    >
      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-7 text-left cursor-pointer"
      >
        <div>
          <p className={`text-xs uppercase tracking-wider ${s.label} mb-1`}>
            {t(label)}
          </p>
          <h2 className="text-xl sm:text-2xl font-light text-neutral-900">
            {t(content.headline)}
          </h2>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className={`w-6 h-6 ${s.chevron}`} />
        </motion.div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-4">
              {/* Pitch */}
              <SubRow
                title={t(subLabels.pitch)}
                chevronColor={s.chevron}
                isOpen={openSub === 'pitch'}
                onToggle={() => toggleSub('pitch')}
              >
                <p className="text-base text-neutral-700 leading-relaxed max-w-2xl">
                  {t(content.pitch)}
                </p>
              </SubRow>

              {/* Scenarios */}
              <SubRow
                title={t(subLabels.scenarios)}
                chevronColor={s.chevron}
                isOpen={openSub === 'scenarios'}
                onToggle={() => toggleSub('scenarios')}
              >
                <div className="max-w-2xl">
                  {/* Scenario chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {content.scenarios.map((scenario, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveScenario(i)}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer ${
                          activeScenario === i
                            ? `${s.iconBg} ${s.iconColor} font-medium`
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {t(scenario.label)}
                      </button>
                    ))}
                  </div>
                  {/* Active story */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeScenario}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-xl ${s.cardBg} border ${s.cardBorder} p-5`}
                    >
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {t(content.scenarios[activeScenario].story)}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </SubRow>

              {/* Why */}
              <SubRow
                title={t(subLabels.why)}
                chevronColor={s.chevron}
                isOpen={openSub === 'why'}
                onToggle={() => toggleSub('why')}
              >
                <p className="text-sm text-neutral-500 leading-relaxed max-w-2xl">
                  {t(content.why)}
                </p>
              </SubRow>

              {/* Benefits */}
              <SubRow
                title={t(subLabels.benefits)}
                chevronColor={s.chevron}
                isOpen={openSub === 'benefits'}
                onToggle={() => toggleSub('benefits')}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, i) => {
                    const Icon = benefit.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 * i }}
                        className={`rounded-xl ${s.cardBg} border ${s.cardBorder} p-5`}
                      >
                        <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
                          <Icon className={`w-4 h-4 ${s.iconColor}`} />
                        </div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                          {t(benefit.title)}
                        </h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                          {t(benefit.desc)}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              </SubRow>

              {/* The shift (practitioner only) */}
              {content.shift && (
                <SubRow
                  title={t(subLabels.shift)}
                  chevronColor={s.chevron}
                  isOpen={openSub === 'shift'}
                  onToggle={() => toggleSub('shift')}
                >
                  <div className="max-w-2xl">
                    <ShiftRow
                      title={locale === 'fr' ? 'Aujourd\u2019hui' : 'Today'}
                      chevronColor={s.chevron}
                      isOpen={openShift === 'today'}
                      onToggle={() => toggleShift('today')}
                    >
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {t(content.shift.today)}
                      </p>
                    </ShiftRow>
                    <ShiftRow
                      title={locale === 'fr' ? 'O\u00f9 \u00e7a s\u2019en va' : 'Where it\u2019s going'}
                      chevronColor={s.chevron}
                      isOpen={openShift === 'future'}
                      onToggle={() => toggleShift('future')}
                    >
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {t(content.shift.future)}
                      </p>
                    </ShiftRow>
                    <ShiftRow
                      title={locale === 'fr' ? 'Ce que Bloomsline fait' : 'What Bloomsline does'}
                      chevronColor={s.chevron}
                      isOpen={openShift === 'bloomsline'}
                      onToggle={() => toggleShift('bloomsline')}
                    >
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {t(content.shift.bloomsline)}
                      </p>
                    </ShiftRow>
                    <p className="text-base font-medium text-neutral-800 pt-4">
                      {t(content.shift.bridge)}
                    </p>
                  </div>
                </SubRow>
              )}

              {/* Closing */}
              <SubRow
                title={t(subLabels.closing)}
                chevronColor={s.chevron}
                isOpen={openSub === 'closing'}
                onToggle={() => toggleSub('closing')}
              >
                <p className="text-base text-neutral-500 leading-relaxed max-w-2xl italic">
                  {t(content.closing)}
                </p>
              </SubRow>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Page ─── */

export default function ForYouPage() {
  const { locale } = useLanguage()
  const [openBlock, setOpenBlock] = useState<'member' | 'practitioner' | null>(null)

  const toggle = (block: 'member' | 'practitioner') => {
    setOpenBlock(openBlock === block ? null : block)
  }

  const pageTitle = {
    en: 'This is for you',
    fr: 'C\u2019est pour vous',
  }
  const pageSubtitle = {
    en: 'Whether you\u2019re looking for support or you support others \u2014 Bloomsline was made with you in mind.',
    fr: 'Que vous cherchiez du soutien ou que vous accompagniez les autres \u2014 Bloomsline a \u00e9t\u00e9 pens\u00e9 pour vous.',
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Minimal top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Logo size="md" showText />
          </a>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Content */}
      <div className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-4">
              {locale === 'fr' ? pageTitle.fr : pageTitle.en}
            </h1>
            <p className="text-lg text-neutral-500 font-light leading-relaxed max-w-xl mx-auto">
              {locale === 'fr' ? pageSubtitle.fr : pageSubtitle.en}
            </p>
          </motion.div>

          {/* Two pitch blocks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            <PitchBlock
              label={{ en: 'For members', fr: 'Pour les membres' }}
              accent="teal"
              benefits={memberBenefits}
              content={memberContent}
              isOpen={openBlock === 'member'}
              onToggle={() => toggle('member')}
              locale={locale}
            />

            <PitchBlock
              label={{ en: 'For practitioners', fr: 'Pour les praticiens' }}
              accent="coral"
              benefits={practitionerBenefits}
              content={practitionerContent}
              isOpen={openBlock === 'practitioner'}
              onToggle={() => toggle('practitioner')}
              locale={locale}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

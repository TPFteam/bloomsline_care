'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Sun, Coffee, Heart, Moon, Scale, TrendingUp, MessageCircle, Check, Plus } from 'lucide-react'

// Animated Rituals Component
function AnimatedRituals() {
  const [checkedItems, setCheckedItems] = useState<number[]>([])
  const [showSummary, setShowSummary] = useState(false)

  const rituals = [
    { name: 'Window Moment', time: '2 min', icon: Sun },
    { name: 'First Sip Ritual', time: '5 min', icon: Coffee },
    { name: 'Evening Wind Down', time: '3 min', icon: Moon },
  ]

  useEffect(() => {
    const animate = () => {
      setCheckedItems([])
      setShowSummary(false)
      setTimeout(() => setCheckedItems([0]), 800)
      setTimeout(() => setCheckedItems([0, 1]), 1800)
      setTimeout(() => setCheckedItems([0, 1, 2]), 2800)
      setTimeout(() => setShowSummary(true), 3500)
    }
    animate()
    const interval = setInterval(animate, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {rituals.map((ritual, i) => {
        const isChecked = checkedItems.includes(i)
        return (
          <motion.div
            key={ritual.name}
            animate={{
              backgroundColor: isChecked ? 'rgb(240 253 244)' : 'rgb(245 245 245)',
              scale: isChecked ? [1, 1.02, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl"
          >
            <motion.div
              animate={{
                backgroundColor: isChecked ? 'rgb(34 197 94)' : 'transparent',
                borderColor: isChecked ? 'rgb(34 197 94)' : 'rgb(212 212 212)',
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center border-2"
            >
              <AnimatePresence>
                {isChecked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <ritual.icon className="w-4 h-4 text-amber-500" />
            <motion.span
              animate={{
                color: isChecked ? 'rgb(156 163 175)' : 'rgb(64 64 64)',
                textDecoration: isChecked ? 'line-through' : 'none',
              }}
              className="flex-1 text-sm"
            >
              {ritual.name}
            </motion.span>
            <span className="text-xs text-neutral-400">{ritual.time}</span>
          </motion.div>
        )
      })}

      {/* Summary after completion */}
      <motion.div
        animate={{ opacity: showSummary ? 1 : 0, y: showSummary ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="pt-3 border-t border-neutral-100 dark:border-neutral-800"
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
          10 minutes of presence today
        </p>
      </motion.div>
    </div>
  )
}

// Animated Moments with Flow Map
function AnimatedMoments() {
  const [visibleMoments, setVisibleMoments] = useState<number[]>([])
  const [pathProgress, setPathProgress] = useState(0)

  const moments = [
    { text: 'Finally finished the book', icon: '✏️', label: 'Text' },
    { text: 'Sunset from my window', icon: '📷', label: 'Photo' },
    { text: 'How I felt today', icon: '🎙️', label: 'Voice' },
    { text: 'Morning walk', icon: '🎬', label: 'Video' },
  ]

  useEffect(() => {
    const animate = () => {
      setVisibleMoments([])
      setPathProgress(0)
      setTimeout(() => { setVisibleMoments([0]); setPathProgress(0.25) }, 600)
      setTimeout(() => { setVisibleMoments([0, 1]); setPathProgress(0.5) }, 1400)
      setTimeout(() => { setVisibleMoments([0, 1, 2]); setPathProgress(0.75) }, 2200)
      setTimeout(() => { setVisibleMoments([0, 1, 2, 3]); setPathProgress(1) }, 3000)
    }
    animate()
    const interval = setInterval(animate, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Captured moments list */}
      <div className="space-y-2">
        {moments.map((moment, i) => (
          <motion.div
            key={moment.text}
            animate={{
              opacity: visibleMoments.includes(i) ? 1 : 0.3,
              x: visibleMoments.includes(i) ? 0 : -5,
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
          >
            <motion.div
              animate={{
                scale: visibleMoments.includes(i) ? 1 : 0.8,
                backgroundColor: visibleMoments.includes(i) ? 'rgb(254 226 226)' : 'rgb(245 245 245)',
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            >
              {moment.icon}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{moment.text}</p>
              <p className="text-xs text-neutral-400">{moment.label}</p>
            </div>
            <motion.div
              animate={{
                scale: visibleMoments.includes(i) ? 1 : 0,
                opacity: visibleMoments.includes(i) ? 1 : 0,
              }}
              className="text-xs text-rose-400"
            >
              ✓
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Flow map visualization */}
      <div className="relative h-20 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl overflow-hidden p-3">
        <svg className="w-full h-full" viewBox="0 0 280 50">
          {/* Connection line */}
          <motion.path
            d="M 20 40 Q 70 15 120 30 Q 170 45 220 20 Q 250 10 270 25"
            fill="none"
            stroke="rgb(244 114 182)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ pathLength: pathProgress }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* Moment dots */}
          {[
            { x: 20, y: 40 },
            { x: 120, y: 30 },
            { x: 220, y: 20 },
            { x: 270, y: 25 },
          ].map((point, i) => (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="rgb(244 114 182)"
              animate={{ scale: visibleMoments.includes(i) ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          ))}
        </svg>
        <p className="absolute bottom-2 left-3 text-xs text-rose-400">Your journey this week</p>
      </div>
    </div>
  )
}

// Animated Balance
function AnimatedBalance() {
  const [values, setValues] = useState([0, 0, 0, 0])
  const [showInsight, setShowInsight] = useState(false)
  const targets = [70, 45, 80, 60]
  const areas = [
    { area: 'Rest', color: 'bg-indigo-400' },
    { area: 'Movement', color: 'bg-emerald-400' },
    { area: 'Connection', color: 'bg-rose-400' },
    { area: 'Purpose', color: 'bg-amber-400' },
  ]

  useEffect(() => {
    const animate = () => {
      setValues([0, 0, 0, 0])
      setShowInsight(false)
      setTimeout(() => setValues(targets), 300)
      setTimeout(() => setShowInsight(true), 1800)
    }
    animate()
    const interval = setInterval(animate, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {areas.map((item, i) => (
        <div key={item.area}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600 dark:text-neutral-400">{item.area}</span>
            <motion.span
              key={values[i]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-neutral-400 text-xs"
            >
              {values[i]}%
            </motion.span>
          </div>
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${item.color} rounded-full`}
              animate={{ width: `${values[i]}%` }}
              transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}

      {/* Insight after bars fill */}
      <motion.div
        animate={{ opacity: showInsight ? 1 : 0, y: showInsight ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="pt-3 border-t border-neutral-100 dark:border-neutral-800"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
          This month you nurtured <span className="text-rose-500 font-medium">Connection</span> the most
        </p>
        <p className="text-xs text-neutral-400 text-center mt-1">
          Maybe Movement needs a little love?
        </p>
      </motion.div>
    </div>
  )
}

// Animated Progress - Visual journey
function AnimatedProgress() {
  const [step, setStep] = useState(0)

  const milestones = [
    { day: 'Nov 3', note: 'First ritual completed' },
    { day: 'Nov 12', note: 'Took time for myself', highlight: true },
    { day: 'Nov 18', note: 'Showed up on a hard day' },
  ]

  useEffect(() => {
    const animate = () => {
      setStep(0)
      setTimeout(() => setStep(1), 500)
      setTimeout(() => setStep(2), 1200)
      setTimeout(() => setStep(3), 1900)
      setTimeout(() => setStep(4), 3000)
    }
    animate()
    const interval = setInterval(animate, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Visual timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
        <motion.div
          className="absolute left-4 top-4 w-0.5 bg-emerald-400 origin-top"
          initial={{ height: 0 }}
          animate={{ height: step >= 3 ? '100%' : step >= 2 ? '66%' : step >= 1 ? '33%' : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Milestones */}
        <div className="space-y-4">
          {milestones.map((milestone, i) => (
            <motion.div
              key={i}
              animate={{ opacity: step > i ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-4 relative"
            >
              <motion.div
                animate={{
                  scale: step > i ? 1 : 0.8,
                  backgroundColor: step > i ? 'rgb(52 211 153)' : 'rgb(229 231 235)',
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0"
              >
                {step > i && <Check className="w-4 h-4 text-white" />}
              </motion.div>
              <div className="flex-1 pt-1">
                <p className="text-xs text-neutral-400 mb-0.5">{milestone.day}</p>
                <motion.p
                  animate={{
                    color: step > i ? 'rgb(5 150 105)' : 'rgb(115 115 115)',
                  }}
                  className="text-sm"
                >
                  {milestone.note}
                </motion.p>
                {milestone.highlight && step > i && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-neutral-500 dark:text-neutral-500 italic mt-1"
                  >
                    "Did not feel guilty. That is new."
                  </motion.p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <motion.div
        animate={{ opacity: step >= 4 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          18 times you chose yourself this month.
        </p>
      </motion.div>
    </div>
  )
}

// Animated Connection
function AnimatedConnection() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const animate = () => {
      setStep(0)
      setTimeout(() => setStep(1), 500)
      setTimeout(() => setStep(2), 1800)
      setTimeout(() => setStep(3), 3200)
    }
    animate()
    const interval = setInterval(animate, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {/* Assessment card */}
      <motion.div
        animate={{ opacity: step >= 1 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
      >
        <p className="text-xs text-neutral-400 mb-2">Weekly check-in</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">How are you feeling?</span>
            <motion.div
              animate={{ opacity: step >= 1 ? 1 : 0.3 }}
              className="flex gap-1"
            >
              {['😔', '😐', '🙂', '😊'].map((emoji, i) => (
                <motion.span
                  key={i}
                  animate={{
                    scale: i === 2 && step >= 1 ? 1.2 : 1,
                    opacity: i === 2 && step >= 1 ? 1 : 0.4,
                  }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm"
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Submitted indicator */}
      <motion.div
        animate={{ opacity: step >= 2 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center gap-2 text-xs text-emerald-500"
      >
        <Check className="w-3 h-3" />
        <span>Shared with your practitioner</span>
      </motion.div>

      {/* Practitioner's note */}
      <motion.div
        animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-medium">Dr</span>
          </div>
          <span className="text-xs text-neutral-500">Left a note</span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
          "Glad to see you feeling better. Let us explore what helped."
        </p>
      </motion.div>
    </div>
  )
}

export function GlimpseSection() {
  const { locale } = useLanguage()

  const journey = [
    {
      id: 'rituals',
      icon: Sun,
      label: { en: 'Rituals', fr: 'Rituels' },
      title: { en: 'Your rituals, your pace', fr: 'Vos rituels, votre rythme' },
      description: {
        en: 'Pick from gentle rituals or create your own. A 2-minute morning pause. A first sip moment. Whatever feels right for you.',
        fr: 'Choisissez parmi des rituels doux ou créez les vôtres. Une pause matinale de 2 minutes. Un moment de première gorgée. Ce qui vous convient.',
      },
      visual: <AnimatedRituals />,
      color: 'from-amber-500/10 to-orange-500/10',
    },
    {
      id: 'moments',
      icon: Heart,
      label: { en: 'Moments', fr: 'Moments' },
      title: { en: 'Capture what matters', fr: 'Capturez ce qui compte' },
      description: {
        en: 'A kind word someone said. A small win. A hard day. Moments become part of your story, mapped in your flow.',
        fr: 'Un mot gentil. Une petite victoire. Un jour difficile. Les moments font partie de votre histoire, cartographiés dans votre flux.',
      },
      visual: <AnimatedMoments />,
      color: 'from-rose-500/10 to-pink-500/10',
    },
    {
      id: 'balance',
      icon: Scale,
      label: { en: 'Balance', fr: 'Équilibre' },
      title: { en: 'Find your balance', fr: 'Trouvez votre équilibre' },
      description: {
        en: 'See where you are spending your energy. Not to judge, but to understand. Small adjustments, not big overhauls.',
        fr: 'Voyez où vous dépensez votre énergie. Pas pour juger, mais pour comprendre. Petits ajustements, pas de grands changements.',
      },
      visual: <AnimatedBalance />,
      color: 'from-indigo-500/10 to-violet-500/10',
    },
    {
      id: 'progress',
      icon: TrendingUp,
      label: { en: 'Progress', fr: 'Progrès' },
      title: { en: 'Progress that feels human', fr: 'Des progrès qui restent humains' },
      description: {
        en: 'Not streaks or points. Just a gentle look back. "Last month you showed up 18 times. That is 18 times you chose yourself."',
        fr: 'Pas de séries ou de points. Juste un regard doux en arrière. "Le mois dernier, vous étiez présent 18 fois. C\'est 18 fois où vous vous êtes choisi."',
      },
      visual: <AnimatedProgress />,
      color: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      id: 'connection',
      icon: MessageCircle,
      label: { en: 'Connection', fr: 'Connexion' },
      title: { en: 'Someone who sees your journey', fr: 'Quelqu\'un qui voit votre parcours' },
      description: {
        en: 'Only if you choose to share. Your practitioner sees not just your hard days, but the full picture. The effort, the small wins, the patterns over time.',
        fr: 'Seulement si vous choisissez de partager. Votre praticien voit non seulement vos jours difficiles, mais l\'ensemble. L\'effort, les petites victoires, les tendances.',
      },
      visual: <AnimatedConnection />,
      color: 'from-teal-500/10 to-cyan-500/10',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
            {locale === 'fr' ? 'Ce que nous avons créé' : 'What we built'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 dark:text-white mb-4">
            {locale === 'fr' ? 'Voici Bloomsline.' : 'This is Bloomsline.'}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {locale === 'fr'
              ? 'Une façon de vous reconnecter à vous-même. De donner du sens aux petits gestes. De voir que ce que vous faites compte.'
              : 'A way to reconnect with yourself. To find meaning in the small things. To see that what you do matters.'}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-24">
          {journey.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  </div>
                  <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    {locale === 'fr' ? step.label.fr : step.label.en}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white mb-4">
                  {locale === 'fr' ? step.title.fr : step.title.en}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {locale === 'fr' ? step.description.fr : step.description.en}
                </p>
              </div>

              {/* Visual */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className={`bg-gradient-to-br ${step.color} rounded-3xl p-6 sm:p-8`}>
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-lg">
                    {step.visual}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Closing reflection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center mt-32"
        >
          <p className="text-2xl sm:text-3xl font-light text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
            {locale === 'fr'
              ? 'Ce ne sont pas des tâches. Ce sont de petits actes de présence à soi-même.'
              : 'These are not tasks. They are small acts of showing up for yourself.'}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400">
            {locale === 'fr'
              ? 'Et avec le temps, ils deviennent la preuve que vous comptez.'
              : 'And over time, they become proof that you matter.'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

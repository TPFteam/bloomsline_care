'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Sun, Coffee, Heart, Moon, Sparkles, TrendingUp, MessageCircle, Check, Plus, Share2, FolderOpen, BarChart3, FileText, ClipboardList, Dumbbell, User, Calendar, Tag } from 'lucide-react'
import { useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'

// Animated Overview Component (for practitioners - analytics view)
function AnimatedOverview({ locale = 'en' }: { locale?: string }) {
  const [activeClient, setActiveClient] = useState<number | null>(null)
  const [showInsight, setShowInsight] = useState(false)

  const clients = [
    { name: 'Sarah M.', initials: 'SM', status: 'active', engagement: 85, color: 'from-rose-200 to-rose-300', statusColor: 'bg-teal-400' },
    { name: 'Marc D.', initials: 'MD', status: 'attention', engagement: 40, color: 'from-amber-200 to-amber-300', statusColor: 'bg-amber-400' },
    { name: 'Julie L.', initials: 'JL', status: 'active', engagement: 72, color: 'from-teal-200 to-teal-300', statusColor: 'bg-teal-400' },
  ]

  const texts = {
    en: {
      title: 'Client engagement this week',
      insight: 'Marc may need a check-in',
    },
    fr: {
      title: 'Dynamiques observées ce trimestre',
      insight: 'Marc a peut-être besoin d\'une attention particulière.',
    },
  }
  const t = texts[locale as keyof typeof texts] || texts.en

  useEffect(() => {
    const animate = () => {
      setActiveClient(null)
      setShowInsight(false)
      setTimeout(() => setActiveClient(0), 600)
      setTimeout(() => setActiveClient(1), 1400)
      setTimeout(() => setShowInsight(true), 2200)
      setTimeout(() => setActiveClient(2), 3000)
    }
    animate()
    const interval = setInterval(animate, 6500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">{t.title}</p>

      {clients.map((client, i) => {
        const isActive = activeClient === i
        const needsAttention = client.status === 'attention'
        return (
          <motion.div
            key={client.name}
            animate={{
              scale: isActive ? 1.02 : 1,
              backgroundColor: isActive && needsAttention ? 'rgb(254 243 199)' : isActive ? 'rgb(240 253 244)' : 'rgb(250 250 250)',
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl"
          >
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${client.color} flex items-center justify-center`}>
              <span className="text-neutral-600 text-xs font-medium">{client.initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-700">{client.name}</p>
                <div className={`w-2 h-2 rounded-full ${client.statusColor}`} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${client.engagement}%` }}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                    className={`h-full rounded-full ${needsAttention ? 'bg-amber-300' : 'bg-teal-300'}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Reserved space for insight */}
      <div className="h-12">
        <AnimatePresence>
          {showInsight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200"
            >
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xs">!</span>
              </div>
              <p className="text-sm text-amber-800 whitespace-nowrap">{t.insight}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Animated Sessions Component (for practitioners - CRM view)
function AnimatedSessions({ locale = 'en' }: { locale?: string }) {
  const [activeSection, setActiveSection] = useState(0)
  const [highlightedNotes, setHighlightedNotes] = useState<number[]>([])

  const texts = {
    en: {
      nextSession: 'Next session: Tomorrow, 2pm',
      keyNotes: 'Key notes from last sessions',
      notes: [
        { text: 'Anxiety around work deadlines', tag: 'Focus area' },
        { text: 'Breathing exercises helping', tag: 'Progress' },
        { text: 'Try journaling this week', tag: 'Action item' },
      ],
      ready: 'Ready for tomorrow\'s session',
    },
    fr: {
      nextSession: 'Prochaine séance : Demain, 14h',
      keyNotes: 'Notes clés des dernières séances',
      notes: [
        { text: 'Anxiété élevée, discours rapide, agitation corporelle.', tag: 'Séance 1' },
        { text: 'Anxiété présente, meilleure verbalisation, tension fluctuante.', tag: 'Séance 2' },
        { text: 'Anxiété modérée, respiration plus stable, début d\'apaisement.', tag: 'Séance 3' },
      ],
      ready: 'Prêt pour la séance de demain',
    },
  }
  const t = texts[locale as keyof typeof texts] || texts.en

  useEffect(() => {
    const animate = () => {
      setActiveSection(0)
      setHighlightedNotes([])
      setTimeout(() => setActiveSection(1), 600)
      setTimeout(() => setHighlightedNotes([0]), 1200)
      setTimeout(() => setHighlightedNotes([0, 1]), 1800)
      setTimeout(() => setHighlightedNotes([0, 1, 2]), 2400)
      setTimeout(() => setActiveSection(2), 3200)
    }
    animate()
    const interval = setInterval(animate, 6500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Client Header */}
      <motion.div
        animate={{ opacity: activeSection >= 0 ? 1 : 0 }}
        className="flex items-center gap-3 pb-3 border-b border-neutral-100"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
          <span className="text-white text-sm font-medium">SM</span>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-800">Sarah M.</p>
          <p className="text-xs text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {t.nextSession}
          </p>
        </div>
      </motion.div>

      {/* Key Notes */}
      <motion.div
        animate={{ opacity: activeSection >= 1 ? 1 : 0.3 }}
        className="space-y-2"
      >
        <p className="text-xs text-neutral-500 uppercase tracking-wide">{t.keyNotes}</p>
        {t.notes.map((note, i) => {
          const isHighlighted = highlightedNotes.includes(i)
          return (
            <motion.div
              key={i}
              animate={{
                backgroundColor: isHighlighted ? 'rgb(219 234 254)' : 'rgb(250 250 250)',
                scale: isHighlighted ? [1, 1.02, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2 p-2 rounded-lg"
            >
              <Tag className={`w-3 h-3 mt-0.5 ${isHighlighted ? 'text-blue-600' : 'text-neutral-300'}`} />
              <div className="flex-1">
                <p className="text-sm text-neutral-700">{note.text}</p>
                <span className={`text-xs ${isHighlighted ? 'text-blue-600' : 'text-neutral-400'}`}>{note.tag}</span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Reserved space for ready indicator */}
      <div className="h-8">
        <AnimatePresence>
          {activeSection >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 pt-2 text-emerald-600"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm">{t.ready}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Animated Resources Component (for practitioners)
function AnimatedResources({ locale = 'en' }: { locale?: string }) {
  const [activeStep, setActiveStep] = useState(0)
  const [sharedItems, setSharedItems] = useState<number[]>([])

  const texts = {
    en: {
      resources: [
        { name: 'Anxiety Worksheet', type: 'Worksheet', icon: FileText, color: 'text-blue-500' },
        { name: 'Weekly Check-in', type: 'Questionnaire', icon: ClipboardList, color: 'text-purple-500' },
        { name: 'Breathing Exercise', type: 'Exercise', icon: Dumbbell, color: 'text-emerald-500' },
      ],
      shared: 'Shared',
      sharedMessage: '3 resources shared with Sarah M.',
    },
    fr: {
      resources: [
        { name: 'Fiche sur l\'anxiété', type: 'Fiche', icon: FileText, color: 'text-blue-500' },
        { name: 'Bilan hebdomadaire', type: 'Questionnaire', icon: ClipboardList, color: 'text-purple-500' },
        { name: 'Exercice de respiration', type: 'Exercice', icon: Dumbbell, color: 'text-emerald-500' },
      ],
      shared: 'Partagé',
      sharedMessage: '3 ressources partagées avec Sarah M.',
    },
  }
  const t = texts[locale as keyof typeof texts] || texts.en

  useEffect(() => {
    const animate = () => {
      setActiveStep(0)
      setSharedItems([])
      setTimeout(() => setActiveStep(1), 800)
      setTimeout(() => setSharedItems([0]), 1500)
      setTimeout(() => setSharedItems([0, 1]), 2300)
      setTimeout(() => setSharedItems([0, 1, 2]), 3100)
      setTimeout(() => setActiveStep(2), 3800)
    }
    animate()
    const interval = setInterval(animate, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-3">
      {t.resources.map((resource, i) => {
        const isShared = sharedItems.includes(i)
        return (
          <motion.div
            key={resource.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: 1,
              x: 0,
              backgroundColor: isShared ? 'rgb(240 253 244)' : 'rgb(250 250 250)',
            }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-100"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center`}>
                <resource.icon className={`w-4 h-4 ${resource.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">{resource.name}</p>
                <p className="text-xs text-neutral-400">{resource.type}</p>
              </div>
            </div>
            <AnimatePresence>
              {isShared ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-emerald-500"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-xs">{t.shared}</span>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: activeStep >= 1 ? 1 : 0.3 }}
                  className="text-neutral-400"
                >
                  <Share2 className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
      {/* Reserved space for shared message */}
      <div className="h-8">
        <AnimatePresence>
          {activeStep >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pt-2 text-sm text-emerald-600"
            >
              {t.sharedMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

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
        className="pt-3 border-t border-neutral-100"
      >
        <p className="text-sm text-neutral-500 text-center">
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
            className="flex items-center gap-3 p-2.5 bg-neutral-100 rounded-xl"
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
              <p className="text-sm text-neutral-700 truncate">{moment.text}</p>
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
      <div className="relative h-20 bg-gradient-to-r from-rose-50 to-pink-50  rounded-xl overflow-hidden p-3">
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
            <span className="text-neutral-600">{item.area}</span>
            <motion.span
              key={values[i]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-neutral-400 text-xs"
            >
              {values[i]}%
            </motion.span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
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
        className="pt-3 border-t border-neutral-100"
      >
        <p className="text-sm text-neutral-600 text-center">
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
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-neutral-200" />
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
                    className="text-xs text-neutral-500  italic mt-1"
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
        className="pt-3 border-t border-neutral-100 text-center"
      >
        <p className="text-sm text-neutral-600">
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
        className="p-3 bg-neutral-100 rounded-xl"
      >
        <p className="text-xs text-neutral-400 mb-2">Weekly check-in</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">How are you feeling?</span>
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
        className="p-3 bg-teal-50  rounded-xl"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-medium">Dr</span>
          </div>
          <span className="text-xs text-neutral-500">Left a note</span>
        </div>
        <p className="text-sm text-neutral-600 italic">
          "Glad to see you feeling better. Let us explore what helped."
        </p>
      </motion.div>
    </div>
  )
}

interface GlimpseSectionProps {
  isPractitionerPage?: boolean
}

export function GlimpseSection({ isPractitionerPage = false }: GlimpseSectionProps) {
  const { locale } = useLanguage()

  // Use shared modal context (only on practitioner page)
  let openModal: (() => void) | null = null
  try {
    const modalContext = useEarlyAccessModal()
    openModal = modalContext.openModal
  } catch {
    // Not within provider
  }

  // Practitioner-specific journey items
  const practitionerJourney = [
    {
      id: 'resources',
      icon: Share2,
      label: { en: 'Resources', fr: 'Ressources', es: 'Recursos' },
      title: { en: 'Share your resources', fr: 'Partagez vos supports', es: 'Comparta sus recursos' },
      description: {
        en: 'Create and organize your questionnaires, exercises, and therapeutic resources in one place.',
        fr: 'Créez et regroupez vos questionnaires, exercices et ressources éducatives.',
        es: 'Cree y organice sus cuestionarios, ejercicios y recursos terapéuticos en un solo lugar.',
      },
      visual: <AnimatedResources locale={locale} />,
      color: 'from-amber-500/10 to-orange-500/10',
    },
    {
      id: 'sessions',
      icon: FolderOpen,
      label: { en: 'Sessions', fr: 'Séances', es: 'Sesiones' },
      title: { en: 'Prepare your sessions effortlessly', fr: 'Préparez vos séances sans effort', es: 'Prepare sus sesiones sin esfuerzo' },
      description: {
        en: 'Clinical elements discussed throughout sessions are accessible without digging through your notes.',
        fr: 'Les éléments abordés au fil des séances sont accessibles sans parcourir l\'ensemble de vos notes.',
        es: 'Los elementos clínicos discutidos a lo largo de las sesiones son accesibles sin revisar todas sus notas.',
      },
      visual: <AnimatedSessions locale={locale} />,
      color: 'from-rose-500/10 to-pink-500/10',
    },
    {
      id: 'overview',
      icon: BarChart3,
      label: { en: 'Overview', fr: 'Vue d\'ensemble', es: 'Vista general' },
      title: { en: 'See the full picture', fr: 'Vue d\'ensemble', es: 'Vea el panorama completo' },
      description: {
        en: 'Rhythm variations and journey continuity become readable, guiding your attention where it\'s needed.',
        fr: 'Les variations de rythme et la continuité des parcours deviennent lisibles, pour orienter votre attention là où elle est nécessaire.',
        es: 'Las variaciones de ritmo y la continuidad del recorrido se vuelven legibles, guiando su atención donde se necesita.',
      },
      visual: <AnimatedOverview locale={locale} />,
      color: 'from-emerald-500/10 to-teal-500/10',
    },
  ]

  const journey = [
    {
      id: 'rituals',
      icon: Sun,
      label: { en: 'Rituals', fr: 'Rituels', es: 'Rituales' },
      title: { en: 'Move forward without guilt', fr: 'Avancer sans culpabilité', es: 'Avanza sin culpa' },
      description: {
        en: 'Adjust what you had planned when the energy isn\'t there. A 2-minute pause instead of 20. A gentle stretch instead of a workout. Whatever feels right today.',
        fr: 'Adapter ce que vous aviez prévu quand l\'énergie n\'est plus là. Une pause de 2 minutes au lieu de 20. Un étirement doux au lieu d\'un entraînement. Ce qui vous convient aujourd\'hui.',
        es: 'Adapta lo que habías planeado cuando la energía no alcanza. Una pausa de 2 minutos en vez de 20. Un estiramiento suave en vez de un entrenamiento. Lo que se sienta bien hoy.',
      },
      visual: <AnimatedRituals />,
      color: 'from-amber-500/10 to-orange-500/10',
    },
    {
      id: 'moments',
      icon: Heart,
      label: { en: 'Moments', fr: 'Moments', es: 'Momentos' },
      title: { en: 'Capture what matters', fr: 'Exprimer ce que vous vivez', es: 'Captura lo que importa' },
      description: {
        en: 'A kind word someone said. A small win. A hard day. Moments become part of your story, mapped in your flow.',
        fr: 'Déposer ce qui vous traverse et garder une trace de ce qui compte vraiment.',
        es: 'Una palabra amable que alguien dijo. Una pequeña victoria. Un día difícil. Los momentos se vuelven parte de tu historia, mapeados en tu flujo.',
      },
      visual: <AnimatedMoments />,
      color: 'from-rose-500/10 to-pink-500/10',
    },
    {
      id: 'balance',
      icon: Sparkles,
      label: { en: 'Balance', fr: 'Équilibre', es: 'Equilibrio' },
      title: { en: 'Find your balance', fr: 'Explorer vos repères à vous', es: 'Encuentra tu equilibrio' },
      description: {
        en: 'See where you are spending your energy. Not to judge, but to understand. Small adjustments, not big overhauls.',
        fr: 'Prendre conscience de son rythme au quotidien pour mieux comprendre ce qui vous fait du bien.',
        es: 'Observa dónde estás gastando tu energía. No para juzgar, sino para entender. Pequeños ajustes, no grandes cambios.',
      },
      visual: <AnimatedBalance />,
      color: 'from-indigo-500/10 to-violet-500/10',
    },
    {
      id: 'progress',
      icon: TrendingUp,
      label: { en: 'Progress', fr: 'Progrès', es: 'Progreso' },
      title: { en: 'Progress that feels human', fr: 'Des progrès qui restent humains', es: 'Progreso que se siente humano' },
      description: {
        en: 'Not streaks or points. Just a gentle look back. "Last month you showed up 18 times. That is 18 times you chose yourself."',
        fr: 'Ici, il n\'y a pas de compétition. Juste un regard bienveillant en arrière. Le mois dernier, vous étiez présent 18 fois. C\'est 18 moments où vous vous êtes choisi.',
        es: 'Sin rachas ni puntos. Solo una mirada amable hacia atrás. "El mes pasado estuviste presente 18 veces. Son 18 veces que te elegiste a ti mismo."',
      },
      visual: <AnimatedProgress />,
      color: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      id: 'connection',
      icon: MessageCircle,
      label: { en: 'Connection', fr: 'Connexion', es: 'Conexión' },
      title: { en: 'Someone who sees your journey', fr: 'Quelqu\'un qui vous voit', es: 'Alguien que ve tu camino' },
      description: {
        en: 'Only if you choose to share. Your practitioner sees not just your hard days, but the full picture. The effort, the small wins, the patterns over time.',
        fr: 'Vous pouvez partager votre parcours avec la personne qui vous accompagne. Elle ne verra pas seulement les moments difficiles, mais l\'ensemble de votre chemin. Les moments qui comptent, les petites victoires et ce qui prend forme avec le temps.',
        es: 'Solo si decides compartir. Tu profesional no solo ve tus días difíciles, sino el panorama completo. El esfuerzo, las pequeñas victorias, los patrones con el tiempo.',
      },
      visual: <AnimatedConnection />,
      color: 'from-teal-500/10 to-cyan-500/10',
    },
  ]

  return (
    <section className="py-24 sm:py-32 bg-neutral-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-400 mb-4">
            {isPractitionerPage
              ? (locale === 'fr' ? 'Pour votre pratique' : locale === 'es' ? 'Para su práctica' : 'For your practice')
              : (locale === 'fr' ? 'Ce que nous avons créé' : locale === 'es' ? 'Lo que creamos' : 'What we built')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
            {isPractitionerPage
              ? (locale === 'fr' ? 'Parce que certains signaux doivent être vus à temps.' : locale === 'es' ? 'Porque algunas señales necesitan ser vistas a tiempo.' : 'Because some signals need to be seen in time.')
              : (locale === 'fr' ? 'Voici Bloomsline.' : locale === 'es' ? 'Esto es Bloomsline.' : 'This is Bloomsline.')}
          </h2>
          <p className="text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            {isPractitionerPage
              ? (locale === 'fr'
                ? 'Des outils pensés pour accompagner vos clients entre les séances, sans alourdir votre quotidien.'
                : locale === 'es'
                ? 'Herramientas diseñadas para acompañar a sus clientes entre sesiones, sin añadir carga a su día a día.'
                : 'Tools designed to support your clients between sessions, without adding to your daily workload.')
              : (locale === 'fr'
                ? 'Une façon de vous reconnecter à vous-même. De donner du sens aux petits gestes. De voir que ce que vous faites compte.'
                : locale === 'es'
                ? 'Una forma de reconectarte contigo mismo. De encontrar sentido en las pequeñas cosas. De ver que lo que haces importa.'
                : 'A way to reconnect with yourself. To find meaning in the small things. To see that what you do matters.')}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-24">
          {(isPractitionerPage ? practitionerJourney : journey).map((step, index) => (
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
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0`}>
                    <step.icon className="w-5 h-5 text-neutral-700" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-light text-neutral-900">
                    {locale === 'fr' ? step.title.fr : locale === 'es' ? step.title.es : step.title.en}
                  </h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  {locale === 'fr' ? step.description.fr : locale === 'es' ? step.description.es : step.description.en}
                </p>
              </div>

              {/* Visual */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className={`bg-gradient-to-br ${step.color} rounded-3xl p-6 sm:p-8`}>
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    {step.visual}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA for practitioner page */}
        {isPractitionerPage && openModal && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mt-20"
          >
            <button
              onClick={openModal}
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white font-medium rounded-full shadow-lg shadow-[#D4856A]/30 hover:shadow-xl hover:from-[#c27459] hover:to-[#d4946b] transition-all duration-300"
            >
              {locale === 'fr' ? 'Tester Bloomsline gratuitement' : locale === 'es' ? 'Prueba Bloomsline gratis' : 'Try Bloomsline for free'}
            </button>
          </motion.div>
        )}

        {/* Closing reflection - hidden on practitioner page */}
        {!isPractitionerPage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center mt-32"
          >
            <p className="text-2xl sm:text-3xl font-light text-neutral-700 leading-relaxed mb-6">
              {locale === 'fr'
                ? 'Le bien-être n\'est pas une liste de tâches à cocher. C\'est avant tout prendre soin de soi sans se forcer.'
                : locale === 'es'
                ? 'Esto no son tareas. Son pequeños actos de cuidarte a ti mismo.'
                : 'These are not tasks. They are small acts of showing up for yourself.'}
            </p>
            {locale !== 'fr' && (
              <p className="text-neutral-500">
                {locale === 'es'
                  ? 'Y con el tiempo, se convierten en la prueba de que importas.'
                  : 'And over time, they become proof that you matter.'}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}

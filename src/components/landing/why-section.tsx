'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { Stethoscope, Heart, ArrowRight, Clock, Eye, Sparkles, Users, BookOpen, MessageCircle, Target } from 'lucide-react'

export function WhySection() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Built for both sides of the journey',
      subtitle: 'Bloomsline bridges the gap between sessions — for practitioners who want to do more, and members who need more than an app.',
      practitioner: {
        label: 'For Practitioners',
        headline: 'Stay connected without burning out',
        painPoints: [
          { icon: Clock, text: 'Clients forget insights between sessions' },
          { icon: Eye, text: 'No visibility into their daily struggles' },
          { icon: BookOpen, text: 'Limited tools to extend your care' },
        ],
        solution: 'Bloomsline gives you a window into your clients\' journey — see their moments, celebrate their wins, and provide support that feels personal, not automated.',
        cta: 'Extend your impact',
      },
      member: {
        label: 'For Members',
        headline: 'Support that actually understands',
        painPoints: [
          { icon: MessageCircle, text: 'Feel alone between appointments' },
          { icon: Target, text: 'Struggle to apply what you learned' },
          { icon: Users, text: 'Apps feel cold and impersonal' },
        ],
        solution: 'Bloomsline meets you where you are — with content chosen by someone who knows you, gentle nudges that respect your pace, and a space that feels like care, not homework.',
        cta: 'Feel supported daily',
      },
    },
    fr: {
      title: 'Conçu pour les deux côtés du parcours',
      subtitle: 'Bloomsline comble le fossé entre les séances — pour les praticiens qui veulent faire plus, et les membres qui ont besoin de plus qu\'une app.',
      practitioner: {
        label: 'Pour les Praticiens',
        headline: 'Restez connecté sans vous épuiser',
        painPoints: [
          { icon: Clock, text: 'Les clients oublient entre les séances' },
          { icon: Eye, text: 'Pas de visibilité sur leurs difficultés' },
          { icon: BookOpen, text: 'Outils limités pour prolonger votre soin' },
        ],
        solution: 'Bloomsline vous offre une fenêtre sur le parcours de vos clients — voyez leurs moments, célébrez leurs victoires, et offrez un soutien qui semble personnel.',
        cta: 'Étendez votre impact',
      },
      member: {
        label: 'Pour les Membres',
        headline: 'Un soutien qui comprend vraiment',
        painPoints: [
          { icon: MessageCircle, text: 'Se sentir seul entre les rendez-vous' },
          { icon: Target, text: 'Difficile d\'appliquer ce qu\'on a appris' },
          { icon: Users, text: 'Les apps semblent froides et impersonnelles' },
        ],
        solution: 'Bloomsline vous rencontre là où vous êtes — avec du contenu choisi par quelqu\'un qui vous connaît, des rappels doux qui respectent votre rythme.',
        cta: 'Sentez-vous soutenu',
      },
    },
  }

  const t = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white to-neutral-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 mb-4">
            {t.title}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-500 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Practitioner Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow"
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-teal-600 uppercase tracking-wide">
                {t.practitioner.label}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-2xl sm:text-3xl font-light text-neutral-900 mb-6">
              {t.practitioner.headline}
            </h3>

            {/* Pain points */}
            <div className="space-y-4 mb-8">
              {t.practitioner.painPoints.map((point, index) => {
                const Icon = point.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-neutral-600">{point.text}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
              <Sparkles className="w-4 h-4 text-teal-400" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
            </div>

            {/* Solution */}
            <p className="text-neutral-600 leading-relaxed mb-6">
              {t.practitioner.solution}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-2 text-teal-600 font-medium group cursor-pointer">
              <span>{t.practitioner.cta}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Member Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow"
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-sm font-medium text-rose-500 uppercase tracking-wide">
                {t.member.label}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-2xl sm:text-3xl font-light text-neutral-900 mb-6">
              {t.member.headline}
            </h3>

            {/* Pain points */}
            <div className="space-y-4 mb-8">
              {t.member.painPoints.map((point, index) => {
                const Icon = point.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-neutral-400" />
                    </div>
                    <span className="text-neutral-600">{point.text}</span>
                  </motion.div>
                )
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
              <Sparkles className="w-4 h-4 text-rose-400" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
            </div>

            {/* Solution */}
            <p className="text-neutral-600 leading-relaxed mb-6">
              {t.member.solution}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-2 text-rose-500 font-medium group cursor-pointer">
              <span>{t.member.cta}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

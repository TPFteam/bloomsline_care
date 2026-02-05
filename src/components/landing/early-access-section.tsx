'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'
import { ArrowRight, Calendar } from 'lucide-react'
import { useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

interface EarlyAccessSectionProps {
  isPractitionerPage?: boolean
}

export function EarlyAccessSection({ isPractitionerPage = false }: EarlyAccessSectionProps) {
  const { locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  const handleOpenModal = () => {
    // Pre-select 'practitioner' if on practitioner page, otherwise no pre-selection
    openModal(isPractitionerPage ? 'practitioner' : undefined)
  }

  return (
    <section className="py-24 sm:py-32 bg-neutral-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 mb-6">
            {locale === 'fr' ? 'Prêt à commencer ?' : locale === 'es' ? '¿Listo para comenzar?' : 'Ready to begin?'}
          </h2>

          <p className="text-lg text-neutral-500 mb-10">
            {locale === 'fr'
              ? 'Rejoignez notre liste d\'attente et soyez parmi les premiers à découvrir Bloomsline.'
              : locale === 'es'
              ? 'Únete a nuestra lista de espera y sé de los primeros en conocer Bloomsline.'
              : 'Join our waitlist and be among the first to experience Bloomsline.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleOpenModal}
              className={`px-8 py-4 rounded-full font-medium inline-flex items-center gap-2 transition-colors ${
                isPractitionerPage
                  ? 'bg-[#D4856A] text-white hover:bg-[#c27459]'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              {locale === 'fr' ? 'Obtenir un accès anticipé' : locale === 'es' ? 'Obtener acceso anticipado' : 'Get Early Access'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full border-2 border-neutral-300 text-neutral-700 font-medium inline-flex items-center gap-2 hover:border-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {locale === 'fr' ? 'Réserver une démo' : locale === 'es' ? 'Reservar una demo' : 'Book a Demo'}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

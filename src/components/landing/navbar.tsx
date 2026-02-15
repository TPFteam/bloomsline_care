'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { t, locale } = useLanguage()
  const { openModal } = useEarlyAccessModal()

  const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

  const handleOpenModal = () => {
    openModal('practitioner')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center"
          >
            <a href="/" className="flex items-center gap-2">
              <Logo size="md" showText />
            </a>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="hidden md:flex items-center gap-3"
          >
            <LanguageSwitcher />
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="font-medium text-gray-700 hover:text-gray-900 rounded-full border-gray-300 hover:border-gray-400 gap-2"
                suppressHydrationWarning
              >
                <Calendar className="w-4 h-4" />
                {locale === 'fr' ? 'Réserver une démo' : locale === 'es' ? 'Reservar una demo' : 'Book a Demo'}
              </Button>
            </a>
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="font-normal text-gray-600 hover:text-gray-900 rounded-full"
                suppressHydrationWarning
              >
                {t.nav.signIn}
              </Button>
            </Link>
            <Button
              onClick={handleOpenModal}
              className="font-medium text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] shadow-[#D4856A]/30 hover:from-[#c27459] hover:to-[#d4946b]"
              suppressHydrationWarning
            >
              {locale === 'fr' ? 'Accès anticipé' : locale === 'es' ? 'Acceso anticipado' : 'Early Access'}
            </Button>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/80 backdrop-blur-xl"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="flex flex-col gap-2 pt-4 border-t border-white/60">
                <LanguageSwitcher />
                <a
                  href={DEMO_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant="outline"
                    className="w-full font-medium text-gray-700 rounded-full border-gray-300 gap-2"
                    suppressHydrationWarning
                  >
                    <Calendar className="w-4 h-4" />
                    {locale === 'fr' ? 'Réserver une démo' : locale === 'es' ? 'Reservar una demo' : 'Book a Demo'}
                  </Button>
                </a>
                <Link href="/sign-in" className="w-full">
                  <Button variant="ghost" className="w-full font-normal rounded-full" suppressHydrationWarning>
                    {t.nav.signIn}
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsOpen(false)
                    handleOpenModal()
                  }}
                  className="w-full font-medium text-white rounded-full shadow-lg bg-gradient-to-r from-[#D4856A] to-[#E8A87C] hover:from-[#c27459] hover:to-[#d4946b]"
                  suppressHydrationWarning
                >
                  {locale === 'fr' ? 'Accès anticipé' : locale === 'es' ? 'Acceso anticipado' : 'Early Access'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

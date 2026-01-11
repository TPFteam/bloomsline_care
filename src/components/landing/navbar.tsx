'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { useTab } from '@/lib/landing/tab-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useEarlyAccessModal } from '@/lib/landing/early-access-modal-context'

interface NavbarProps {
  isPractitionerPage?: boolean
}

export function Navbar({ isPractitionerPage = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t, locale } = useLanguage()
  const { activeTab } = useTab()

  // Only use the modal hook if on practitioner page (where provider exists)
  let openModal: (() => void) | null = null
  try {
    const modalContext = useEarlyAccessModal()
    openModal = modalContext.openModal
  } catch {
    // Not within provider, openModal stays null
  }

  const isPractitioner = activeTab === 'practitioner'

  const navItems = [
    { label: t.nav.home, href: '/', active: !isPractitioner },
    { label: t.nav.forPractitioners, href: '/practitioner', active: isPractitioner },
  ]

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

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:flex items-center gap-8"
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm font-normal transition-colors ${
                  item.active
                    ? 'text-gray-900 flex items-center gap-1.5'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
                {item.label}
              </a>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="hidden md:flex items-center gap-3"
          >
            <LanguageSwitcher />
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="font-normal text-gray-600 hover:text-gray-900 rounded-full"
                suppressHydrationWarning
              >
                {t.nav.signIn}
              </Button>
            </Link>
            {isPractitionerPage && openModal ? (
              <Button
                onClick={openModal}
                className={`font-medium text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-[#D4856A] to-[#E8A87C] shadow-[#D4856A]/30 hover:from-[#c27459] hover:to-[#d4946b]`}
                suppressHydrationWarning
              >
                {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
              </Button>
            ) : (
              <Link href="/early-access">
                <Button
                  className={`font-medium text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isPractitioner
                      ? 'bg-gradient-to-r from-[#D4856A] to-[#E8A87C] shadow-[#D4856A]/30 hover:from-[#c27459] hover:to-[#d4946b]'
                      : 'bg-gradient-to-r from-[#4A9A86] to-[#5AB39C] shadow-[#4A9A86]/30 hover:from-[#3d8a76] hover:to-[#4da38c]'
                  }`}
                  suppressHydrationWarning
                >
                  {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
                </Button>
              </Link>
            )}
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
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 text-sm font-normal transition-colors ${
                    item.active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/60">
                <LanguageSwitcher />
                <Link href="/sign-in" className="w-full">
                  <Button variant="ghost" className="w-full font-normal rounded-full" suppressHydrationWarning>
                    {t.nav.signIn}
                  </Button>
                </Link>
                {isPractitionerPage && openModal ? (
                  <Button
                    onClick={() => {
                      setIsOpen(false)
                      openModal()
                    }}
                    className="w-full font-medium text-white rounded-full shadow-lg bg-gradient-to-r from-[#D4856A] to-[#E8A87C] hover:from-[#c27459] hover:to-[#d4946b]"
                    suppressHydrationWarning
                  >
                    {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
                  </Button>
                ) : (
                  <Link href="/early-access" className="w-full">
                    <Button
                      className={`w-full font-medium text-white rounded-full shadow-lg ${
                        isPractitioner
                          ? 'bg-gradient-to-r from-[#D4856A] to-[#E8A87C] hover:from-[#c27459] hover:to-[#d4946b]'
                          : 'bg-gradient-to-r from-[#4A9A86] to-[#5AB39C] hover:from-[#3d8a76] hover:to-[#4da38c]'
                      }`}
                      suppressHydrationWarning
                    >
                      {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

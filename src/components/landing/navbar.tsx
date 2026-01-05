'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { t, locale } = useLanguage()

  const navItems = [
    { label: t.nav.home, href: '/', active: true },
    { label: locale === 'fr' ? 'Accès anticipé' : 'Early Access', href: '/early-access' },
    { label: t.nav.forPractitioners, href: '/practitioner' },
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
                className={`text-sm font-medium transition-colors ${
                  item.active
                    ? 'text-foreground flex items-center gap-1.5'
                    : 'text-gray-600 hover:text-foreground'
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
                className="font-semibold text-gray-700 hover:text-foreground rounded-full"
                suppressHydrationWarning
              >
                {t.nav.signIn}
              </Button>
            </Link>
            <Link href="/early-access">
              <Button
                className="font-semibold bg-gradient-to-r from-lavender-500 to-lavender-600 text-white hover:from-lavender-600 hover:to-lavender-700 rounded-full px-6 shadow-lg shadow-lavender-500/30 hover:shadow-xl transition-all duration-300"
                suppressHydrationWarning
              >
                {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
              </Button>
            </Link>
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
                  className={`block py-2 text-sm font-medium transition-colors ${
                    item.active ? 'text-foreground' : 'text-gray-600 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/60">
                <LanguageSwitcher />
                <Link href="/sign-in" className="w-full">
                  <Button variant="ghost" className="w-full font-semibold rounded-full" suppressHydrationWarning>
                    {t.nav.signIn}
                  </Button>
                </Link>
                <Link href="/early-access" className="w-full">
                  <Button className="w-full font-semibold bg-gradient-to-r from-lavender-500 to-lavender-600 text-white hover:from-lavender-600 hover:to-lavender-700 rounded-full shadow-lg" suppressHydrationWarning>
                    {locale === 'fr' ? 'Accès anticipé' : 'Early Access'}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

'use client'

import { motion } from 'framer-motion'
import {
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import { Logo } from '@/components/ui/logo'

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/company/bloomsline/', key: 'linkedin' },
  { icon: Instagram, href: 'https://www.instagram.com/bloomsline_/', key: 'instagram' },
]

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="col-span-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <Logo size="lg" showText variant="dark" />
            </div>
            <p className="text-neutral-400 text-sm sm:text-base mb-4 max-w-sm" suppressHydrationWarning>
              {t.footer.brandDescription}
            </p>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
              <a href={`mailto:${t.footer.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors" suppressHydrationWarning>
                <Mail className="w-4 h-4" />
                {t.footer.contactEmail}
              </a>
              <span className="flex items-center gap-2" suppressHydrationWarning>
                <MapPin className="w-4 h-4" />
                {t.footer.location}
              </span>
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold text-white text-sm mb-3" suppressHydrationWarning>{t.footer.sections.company.title}</h3>
            <ul className="space-y-2">
              {t.footer.sections.company.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                    suppressHydrationWarning
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold text-white text-sm mb-3" suppressHydrationWarning>{t.footer.sections.legal.title}</h3>
            <ul className="space-y-2">
              {t.footer.sections.legal.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                    suppressHydrationWarning
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="pt-6 sm:pt-8 border-t border-neutral-800 flex flex-col-reverse sm:flex-row justify-between items-center gap-4"
        >
          <p className="text-xs sm:text-sm text-neutral-400" suppressHydrationWarning>
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.footer.socialLabels[social.key as keyof typeof t.footer.socialLabels]}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center transition-colors group"
              >
                <social.icon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 group-hover:text-teal-700" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

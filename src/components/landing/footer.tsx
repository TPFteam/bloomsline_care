'use client'

import { motion } from 'framer-motion'
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

const socialLinks = [
  { icon: Twitter, href: '#', key: 'twitter' },
  { icon: Linkedin, href: '#', key: 'linkedin' },
  { icon: Github, href: '#', key: 'github' },
]

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-gradient-to-b from-background to-teal-50/20 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-lavender-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-lavender-600 bg-clip-text text-transparent">
                Bloomsline
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm" suppressHydrationWarning>
              {t.footer.brandDescription}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${t.footer.contactEmail}`} className="hover:text-foreground transition-colors" suppressHydrationWarning>
                  {t.footer.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href={`tel:${t.footer.contactPhone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors" suppressHydrationWarning>
                  {t.footer.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span suppressHydrationWarning>{t.footer.location}</span>
              </div>
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>{t.footer.sections.product.title}</h3>
            <ul className="space-y-3">
              {t.footer.sections.product.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    suppressHydrationWarning
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>{t.footer.sections.company.title}</h3>
            <ul className="space-y-3">
              {t.footer.sections.company.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    suppressHydrationWarning
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>{t.footer.sections.resources.title}</h3>
            <ul className="space-y-3">
              {t.footer.sections.resources.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="font-semibold text-foreground mb-4" suppressHydrationWarning>{t.footer.sections.legal.title}</h3>
            <ul className="space-y-3">
              {t.footer.sections.legal.links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
          className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.key}
                href={social.href}
                aria-label={t.footer.socialLabels[social.key as keyof typeof t.footer.socialLabels]}
                className="w-10 h-10 rounded-full bg-teal-100 hover:bg-teal-200 flex items-center justify-center transition-colors group"
              >
                <social.icon className="w-5 h-5 text-teal-600 group-hover:text-teal-700" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/context'

export interface BreadcrumbItem {
  label: string
  labelFr?: string
  labelEs?: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showBack?: boolean
  showHome?: boolean
  className?: string
}

export function Breadcrumb({ items, showBack = true, showHome = true, className = '' }: BreadcrumbProps) {
  const router = useRouter()
  const { locale } = useLanguage()

  const getLabel = (item: BreadcrumbItem) => {
    if (locale === 'fr' && item.labelFr) {
      return item.labelFr
    }
    if (locale === 'es' && item.labelEs) {
      return item.labelEs
    }
    return item.label
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-gray-200/60 text-gray-600 hover:text-gray-900 transition-all group mr-2"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">{locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}</span>
        </button>
      )}

      <ol className="flex items-center gap-1.5 flex-wrap">
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li className="text-gray-300">
                <ChevronRight className="w-4 h-4" />
              </li>
            )}
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
                >
                  {item.icon}
                  <span>{getLabel(item)}</span>
                </Link>
              ) : (
                <span className={`flex items-center gap-1.5 px-2 py-1 ${isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {item.icon}
                  <span className="truncate max-w-[200px]">{getLabel(item)}</span>
                </span>
              )}

              {!isLast && (
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
            </li>
          )
        })}
      </ol>
    </motion.nav>
  )
}

// Compact version for tighter spaces
export function BreadcrumbCompact({ items, className = '' }: { items: BreadcrumbItem[], className?: string }) {
  const { locale } = useLanguage()

  const getLabel = (item: BreadcrumbItem) => {
    if (locale === 'fr' && item.labelFr) {
      return item.labelFr
    }
    if (locale === 'es' && item.labelEs) {
      return item.labelEs
    }
    return item.label
  }

  return (
    <nav className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-gray-900 transition-colors">
                {getLabel(item)}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-700' : ''}>
                {getLabel(item)}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3" />}
          </span>
        )
      })}
    </nav>
  )
}

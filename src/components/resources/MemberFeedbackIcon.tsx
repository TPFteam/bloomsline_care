'use client'

/**
 * Tiny icon that renders the patient's post-submission mood —
 * stored in resource_responses.member_feedback (or
 * member_shared_resources.member_feedback when no response exists yet).
 *
 * The patient picks it on the mobile app right before submitting a
 * resource (see bloomsline_mobile/app/(main)/practitioner.tsx).
 * Mapping mirrors that screen so the practitioner sees the same
 * Frown/Meh/Smile icons in the same red/amber/green palette.
 */

import { Frown, Meh, Smile } from 'lucide-react'

export type MemberFeedback = 'negative' | 'neutral' | 'positive' | null | undefined

interface Props {
  feedback: MemberFeedback
  /** Tailwind size class applied to the icon. Defaults to w-4 h-4. */
  size?: string
  /** When true, wraps the icon in a tinted circle pill. */
  pill?: boolean
  /** Optional hover label override. */
  title?: string
  className?: string
}

const CONFIG: Record<NonNullable<MemberFeedback>, { Icon: typeof Smile; color: string; bg: string; ring: string; en: string; fr: string; es: string }> = {
  negative: { Icon: Frown, color: 'text-red-500',    bg: 'bg-red-50',    ring: 'ring-red-200',    en: 'Felt difficult',     fr: 'Difficile à vivre',    es: 'Se sintió difícil' },
  neutral:  { Icon: Meh,   color: 'text-amber-500',  bg: 'bg-amber-50',  ring: 'ring-amber-200',  en: 'Felt mixed',         fr: 'Sentiment mitigé',     es: 'Sintió mixto' },
  positive: { Icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-200', en: 'Felt good',         fr: 'Sensation positive',   es: 'Se sintió bien' },
}

export function MemberFeedbackIcon({ feedback, size = 'w-4 h-4', pill = false, title, className = '' }: Props) {
  if (!feedback) return null
  const cfg = CONFIG[feedback]
  if (!cfg) return null
  const { Icon, color, bg, ring } = cfg
  const label = title ?? cfg.en

  if (pill) {
    return (
      <span
        title={label}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bg} ring-1 ${ring} ${className}`}
      >
        <Icon className={`${size} ${color}`} aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    )
  }
  return (
    <span title={label} className={`inline-flex items-center ${className}`}>
      <Icon className={`${size} ${color}`} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Locale-aware tooltip helper if you need it in JSX directly. */
export function feedbackLabel(feedback: MemberFeedback, locale: string): string {
  if (!feedback) return ''
  return CONFIG[feedback]?.[locale as 'en' | 'fr' | 'es'] ?? CONFIG[feedback]?.en ?? ''
}

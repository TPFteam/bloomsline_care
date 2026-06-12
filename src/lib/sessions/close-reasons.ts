// Single source of truth for the "didn't happen" close flow.
//
// The practitioner clicks one "No-show" button, then picks a granular reason
// grouped under a category. The CATEGORY decides the recorded status, the
// specific reason is stored for the record, and the reason also drives a smart
// payment default:
//
//   No notice (silence)  → no_show   · default Paid   (you held the slot)
//   Called off (notice)  → cancelled · default depends:
//                            practitioner-side → Unpaid (don't bill your own)
//                            patient-side      → no default (you decide)

export type CloseStatus = 'no_show' | 'cancelled'

// Reasons that mean "patient simply didn't show, no notice" → no_show.
// Everything else is a cancellation. `patient_no_show` is a legacy slug from an
// earlier reason set — kept here so old records still classify as no-show.
const NO_SHOW_REASONS = new Set(['no_communication', 'forgot', 'patient_no_show', 'other'])
// Reasons that pre-select Paid (the slot was held and lost).
const PAID_DEFAULT = new Set(['no_communication', 'forgot', 'patient_no_show'])
// Reasons that pre-select Unpaid (the cancellation was on the practitioner).
const UNPAID_DEFAULT = new Set(['practitioner_unavailable', 'practitioner_cancelled'])

export function reasonToStatus(reason: string | null | undefined): CloseStatus {
  return reason && !NO_SHOW_REASONS.has(reason) ? 'cancelled' : 'no_show'
}

// Smart payment pre-selection from the reason. null = no default, the
// practitioner must choose (patient-side cancellations, where billing depends
// on the notice given).
export function reasonToPaymentDefault(reason: string | null | undefined): 'paid' | 'unpaid' | null {
  if (reason && PAID_DEFAULT.has(reason)) return 'paid'
  if (reason && UNPAID_DEFAULT.has(reason)) return 'unpaid'
  return null
}

type Locale = string
const tt = (locale: Locale, en: string, fr: string, es: string) =>
  locale === 'fr' ? fr : locale === 'es' ? es : en

// Granular reasons grouped by category. The group a reason sits in mirrors what
// reasonToStatus() does with it, so what the practitioner sees matches what
// gets stored.
export function getCloseReasonGroups(locale: Locale): { label: string; options: [string, string][] }[] {
  return [
    {
      label: tt(locale, 'No notice — recorded as no-show', 'Sans préavis — comptée comme absence', 'Sin aviso — como ausencia'),
      options: [
        ['no_communication', tt(locale, "Didn't show, no contact", 'Absent, aucun contact', 'No asistió, sin contacto')],
        ['forgot', tt(locale, 'Patient forgot', 'Patient a oublié', 'El paciente olvidó')],
      ],
    },
    {
      label: tt(locale, 'Cancelled by patient — recorded as cancelled', 'Annulée par le patient — comptée comme annulation', 'Cancelada por el paciente — como cancelación'),
      options: [
        ['client_request', tt(locale, 'Patient cancelled', 'Annulé par le patient', 'Cancelado por el paciente')],
        ['late_cancellation', tt(locale, 'Late cancellation', 'Annulation tardive', 'Cancelación tardía')],
        ['illness', tt(locale, 'Illness', 'Maladie', 'Enfermedad')],
        ['emergency', tt(locale, 'Emergency', 'Urgence', 'Emergencia')],
      ],
    },
    {
      label: tt(locale, 'Cancelled by you — recorded as cancelled', 'Annulée par vous — comptée comme annulation', 'Cancelada por ti — como cancelación'),
      options: [
        ['practitioner_unavailable', tt(locale, 'You were unavailable', 'Vous étiez indisponible', 'No estabas disponible')],
        ['scheduling_conflict', tt(locale, 'Scheduling conflict', "Conflit d'agenda", 'Conflicto de agenda')],
        ['technical_issue', tt(locale, 'Technical issue', 'Problème technique', 'Problema técnico')],
      ],
    },
    {
      label: tt(locale, 'Other', 'Autre', 'Otro'),
      options: [
        ['other', tt(locale, 'Other', 'Autre', 'Otro')],
      ],
    },
  ]
}

// Reasons for cancelling a FUTURE appointment (no "didn't show" group — it
// hasn't happened). Reuses the cancellation groups from getCloseReasonGroups.
export function getCancelReasonGroups(locale: Locale): { label: string; options: [string, string][] }[] {
  return getCloseReasonGroups(locale).filter((g) => !g.options.some(([v]) => NO_SHOW_REASONS.has(v)))
}

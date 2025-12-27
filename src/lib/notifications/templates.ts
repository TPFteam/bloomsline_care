// ============================================
// Notification Templates
// ============================================

import type { NotificationType } from './types'

interface NotificationTemplate {
  title: (metadata: Record<string, unknown>, locale: 'en' | 'fr') => string
  body: (metadata: Record<string, unknown>, locale: 'en' | 'fr') => string
  actionUrl: (metadata: Record<string, unknown>) => string
  emailSubject: (metadata: Record<string, unknown>, locale: 'en' | 'fr') => string
}

const templates: Record<NotificationType, NotificationTemplate> = {
  // ============================================
  // B2C - Member Notifications
  // ============================================

  resource_shared: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle ressource partagée' : 'New resource shared',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.practitionerName} a partagé "${m.resourceTitle}" avec vous`
        : `${m.practitionerName} shared "${m.resourceTitle}" with you`,
    actionUrl: (m) => `/fill/shared/${m.resourceId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.practitionerName} a partagé une ressource avec vous`
        : `${m.practitionerName} shared a resource with you`,
  },

  resource_assigned: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle tâche assignée' : 'New assignment',
    body: (m, locale) => {
      const due = m.dueDate ? ` (${locale === 'fr' ? 'échéance' : 'due'}: ${m.dueDate})` : ''
      return locale === 'fr'
        ? `${m.practitionerName} vous a assigné "${m.resourceTitle}"${due}`
        : `${m.practitionerName} assigned "${m.resourceTitle}" to you${due}`
    },
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle tâche: ${m.resourceTitle}`
        : `New assignment: ${m.resourceTitle}`,
  },

  assignment_due_soon: {
    title: (m, locale) =>
      locale === 'fr' ? 'Échéance demain' : 'Due tomorrow',
    body: (m, locale) =>
      locale === 'fr'
        ? `"${m.resourceTitle}" est à rendre demain`
        : `"${m.resourceTitle}" is due tomorrow`,
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: ${m.resourceTitle} est à rendre demain`
        : `Reminder: ${m.resourceTitle} is due tomorrow`,
  },

  assignment_overdue: {
    title: (m, locale) =>
      locale === 'fr' ? 'Tâche en retard' : 'Assignment overdue',
    body: (m, locale) =>
      locale === 'fr'
        ? `"${m.resourceTitle}" était à rendre le ${m.dueDate}`
        : `"${m.resourceTitle}" was due on ${m.dueDate}`,
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `En retard: ${m.resourceTitle}`
        : `Overdue: ${m.resourceTitle}`,
  },

  session_scheduled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session programmée' : 'Session scheduled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session avec ${m.practitionerName} est prévue le ${m.scheduledAt}`
        : `Your session with ${m.practitionerName} is scheduled for ${m.scheduledAt}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session confirmée: ${m.scheduledAt}`
        : `Session confirmed: ${m.scheduledAt}`,
  },

  session_reminder_24h: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session demain' : 'Session tomorrow',
    body: (m, locale) =>
      locale === 'fr'
        ? `Rappel: session avec ${m.practitionerName || m.memberName} demain à ${m.time}`
        : `Reminder: session with ${m.practitionerName || m.memberName} tomorrow at ${m.time}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: session demain à ${m.time}`
        : `Reminder: session tomorrow at ${m.time}`,
  },

  session_reminder_1h: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session dans 1 heure' : 'Session in 1 hour',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session commence bientôt`
        : `Your session starts soon`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session dans 1 heure`
        : `Session in 1 hour`,
  },

  session_cancelled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session annulée' : 'Session cancelled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session du ${m.scheduledAt} a été annulée`
        : `Your session on ${m.scheduledAt} has been cancelled`,
    actionUrl: () => '/sessions',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session annulée: ${m.scheduledAt}`
        : `Session cancelled: ${m.scheduledAt}`,
  },

  session_rescheduled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session reprogrammée' : 'Session rescheduled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle date proposée: ${m.newTime}`
        : `New proposed time: ${m.newTime}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session reprogrammée`
        : `Session rescheduled`,
  },

  booking_confirmed: {
    title: (m, locale) =>
      locale === 'fr' ? 'Réservation confirmée' : 'Booking confirmed',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre ${m.sessionType} est confirmé pour le ${m.scheduledAt}`
        : `Your ${m.sessionType} is confirmed for ${m.scheduledAt}`,
    actionUrl: (m) => `/bookings/${m.bookingId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Réservation confirmée: ${m.scheduledAt}`
        : `Booking confirmed: ${m.scheduledAt}`,
  },

  booking_cancelled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Réservation annulée' : 'Booking cancelled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre réservation du ${m.scheduledAt} a été annulée`
        : `Your booking on ${m.scheduledAt} has been cancelled`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Réservation annulée`
        : `Booking cancelled`,
  },

  weekly_summary: {
    title: (m, locale) =>
      locale === 'fr' ? 'Votre semaine en résumé' : 'Your week in review',
    body: (m, locale) =>
      locale === 'fr'
        ? `Découvrez vos progrès et insights de la semaine`
        : `See your progress and insights from this week`,
    actionUrl: () => '/progress',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Votre résumé hebdomadaire`
        : `Your weekly summary`,
  },

  ritual_reminder: {
    title: (m, locale) =>
      locale === 'fr' ? 'Rappel de rituel' : 'Ritual reminder',
    body: (m, locale) =>
      locale === 'fr'
        ? `N'oubliez pas votre rituel: ${m.ritualName}`
        : `Do not forget your ritual: ${m.ritualName}`,
    actionUrl: () => '/rituals',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: ${m.ritualName}`
        : `Reminder: ${m.ritualName}`,
  },

  bloom_checkin: {
    title: (m, locale) =>
      locale === 'fr' ? 'Bloom veut prendre de vos nouvelles' : 'Bloom wants to check in',
    body: (m, locale) =>
      locale === 'fr'
        ? `Comment allez-vous aujourd'hui?`
        : `How are you doing today?`,
    actionUrl: () => '/home',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Comment allez-vous?`
        : `How are you?`,
  },

  // ============================================
  // B2B - Practitioner Notifications
  // ============================================

  resource_submitted: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle soumission' : 'New submission',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a soumis "${m.resourceTitle}"`
        : `${m.memberName} submitted "${m.resourceTitle}"`,
    actionUrl: (m) => `/resources/${m.resourceId}/responses/${m.responseId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a soumis ${m.resourceTitle}`
        : `${m.memberName} submitted ${m.resourceTitle}`,
  },

  resource_started: {
    title: (m, locale) =>
      locale === 'fr' ? 'Ressource commencée' : 'Resource started',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a commencé "${m.resourceTitle}"`
        : `${m.memberName} started "${m.resourceTitle}"`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a commencé ${m.resourceTitle}`
        : `${m.memberName} started ${m.resourceTitle}`,
  },

  booking_request: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle demande de réservation' : 'New booking request',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} demande un ${m.sessionType} le ${m.requestedTime}`
        : `${m.clientName} requested a ${m.sessionType} on ${m.requestedTime}`,
    actionUrl: (m) => `/bookings/${m.bookingId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle réservation de ${m.clientName}`
        : `New booking from ${m.clientName}`,
  },

  session_confirmed: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session confirmée' : 'Session confirmed',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a confirmé la session du ${m.scheduledAt}`
        : `${m.memberName} confirmed the session on ${m.scheduledAt}`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a confirmé la session`
        : `${m.memberName} confirmed the session`,
  },

  reschedule_requested: {
    title: (m, locale) =>
      locale === 'fr' ? 'Demande de report' : 'Reschedule requested',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} demande à reporter la session du ${m.originalTime}`
        : `${m.memberName} requested to reschedule the session on ${m.originalTime}`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} demande un report`
        : `${m.memberName} requested a reschedule`,
  },

  member_invitation_accepted: {
    title: (m, locale) =>
      locale === 'fr' ? 'Invitation acceptée' : 'Invitation accepted',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a rejoint votre espace`
        : `${m.memberName} joined your practice`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a accepté votre invitation`
        : `${m.memberName} accepted your invitation`,
  },

  member_invitation_rejected: {
    title: (m, locale) =>
      locale === 'fr' ? 'Invitation déclinée' : 'Invitation declined',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a décliné votre invitation`
        : `${m.memberName} declined your invitation`,
    actionUrl: () => '/members',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a décliné l'invitation`
        : `${m.memberName} declined the invitation`,
  },

  member_inactive: {
    title: (m, locale) =>
      locale === 'fr' ? 'Membre inactif' : 'Inactive member',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} n'a pas été actif depuis ${m.daysSinceActive} jours`
        : `${m.memberName} has been inactive for ${m.daysSinceActive} days`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} est inactif`
        : `${m.memberName} is inactive`,
  },
}

/**
 * Get notification content from template
 */
export function getNotificationContent(
  type: NotificationType,
  metadata: Record<string, unknown>,
  locale: 'en' | 'fr' = 'en'
): {
  title: string
  body: string
  actionUrl: string
  emailSubject: string
} {
  const template = templates[type]
  return {
    title: template.title(metadata, locale),
    body: template.body(metadata, locale),
    actionUrl: template.actionUrl(metadata),
    emailSubject: template.emailSubject(metadata, locale),
  }
}

export { templates }

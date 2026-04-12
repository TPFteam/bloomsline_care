// ============================================
// Notification Templates
// ============================================

import type { NotificationType } from './types'

interface NotificationTemplate {
  title: (metadata: Record<string, unknown>, locale: 'en' | 'fr' | 'es') => string
  body: (metadata: Record<string, unknown>, locale: 'en' | 'fr' | 'es') => string
  actionUrl: (metadata: Record<string, unknown>) => string
  emailSubject: (metadata: Record<string, unknown>, locale: 'en' | 'fr' | 'es') => string
}

const templates: Record<NotificationType, NotificationTemplate> = {
  // ============================================
  // B2C - Member Notifications
  // ============================================

  resource_shared: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle ressource partagée' : locale === 'es' ? 'Nuevo recurso compartido' : 'New resource shared',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.practitionerName} a partagé une ressource avec vous : "${m.resourceTitle}"\n\nPrenez un moment quand vous êtes prêt(e) — elle est là pour vous.`
        : locale === 'es'
          ? `${m.practitionerName} compartió un recurso contigo: "${m.resourceTitle}"\n\nTómate un momento cuando estés listo(a) — está ahí para ti.`
          : `${m.practitionerName} shared a resource with you: "${m.resourceTitle}"\n\nTake a moment when you're ready — it's there for you.`,
    actionUrl: (m) => `/resources/${m.resourceId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Votre praticien(ne), ${m.practitionerName}, a partagé "${m.resourceTitle}" avec vous`
        : locale === 'es'
          ? `Tu profesional, ${m.practitionerName}, compartió "${m.resourceTitle}" contigo`
          : `Your practitioner, ${m.practitionerName}, shared "${m.resourceTitle}" with you`,
  },

  resource_assigned: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle tâche assignée' : locale === 'es' ? 'Nueva tarea asignada' : 'New assignment',
    body: (m, locale) => {
      const due = m.dueDate ? ` (${locale === 'fr' ? 'échéance' : locale === 'es' ? 'vencimiento' : 'due'}: ${m.dueDate})` : ''
      return locale === 'fr'
        ? `${m.practitionerName} vous a assigné "${m.resourceTitle}"${due}`
        : locale === 'es'
          ? `${m.practitionerName} te asignó "${m.resourceTitle}"${due}`
          : `${m.practitionerName} assigned "${m.resourceTitle}" to you${due}`
    },
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle tâche: ${m.resourceTitle}`
        : locale === 'es'
          ? `Nueva tarea: ${m.resourceTitle}`
          : `New assignment: ${m.resourceTitle}`,
  },

  assignment_due_soon: {
    title: (m, locale) =>
      locale === 'fr' ? 'Échéance demain' : locale === 'es' ? 'Vence mañana' : 'Due tomorrow',
    body: (m, locale) =>
      locale === 'fr'
        ? `"${m.resourceTitle}" est à rendre demain`
        : locale === 'es'
          ? `"${m.resourceTitle}" vence mañana`
          : `"${m.resourceTitle}" is due tomorrow`,
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: ${m.resourceTitle} est à rendre demain`
        : locale === 'es'
          ? `Recordatorio: ${m.resourceTitle} vence mañana`
          : `Reminder: ${m.resourceTitle} is due tomorrow`,
  },

  assignment_overdue: {
    title: (m, locale) =>
      locale === 'fr' ? 'Tâche en retard' : locale === 'es' ? 'Tarea atrasada' : 'Assignment overdue',
    body: (m, locale) =>
      locale === 'fr'
        ? `"${m.resourceTitle}" était à rendre le ${m.dueDate}`
        : locale === 'es'
          ? `"${m.resourceTitle}" venció el ${m.dueDate}`
          : `"${m.resourceTitle}" was due on ${m.dueDate}`,
    actionUrl: (m) => `/fill/${m.assignmentId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `En retard: ${m.resourceTitle}`
        : locale === 'es'
          ? `Atrasado: ${m.resourceTitle}`
          : `Overdue: ${m.resourceTitle}`,
  },

  session_scheduled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session programmée' : locale === 'es' ? 'Sesión programada' : 'Session scheduled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session avec ${m.practitionerName} est prévue le ${m.scheduledAt}`
        : locale === 'es'
          ? `Tu sesión con ${m.practitionerName} está programada para el ${m.scheduledAt}`
          : `Your session with ${m.practitionerName} is scheduled for ${m.scheduledAt}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session confirmée: ${m.scheduledAt}`
        : locale === 'es'
          ? `Sesión confirmada: ${m.scheduledAt}`
          : `Session confirmed: ${m.scheduledAt}`,
  },

  session_reminder_24h: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session demain' : locale === 'es' ? 'Sesión mañana' : 'Session tomorrow',
    body: (m, locale) =>
      locale === 'fr'
        ? `Rappel: session avec ${m.practitionerName || m.memberName} demain à ${m.time}`
        : locale === 'es'
          ? `Recordatorio: sesión con ${m.practitionerName || m.memberName} mañana a las ${m.time}`
          : `Reminder: session with ${m.practitionerName || m.memberName} tomorrow at ${m.time}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: session demain à ${m.time}`
        : locale === 'es'
          ? `Recordatorio: sesión mañana a las ${m.time}`
          : `Reminder: session tomorrow at ${m.time}`,
  },

  session_reminder_1h: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session dans 1 heure' : locale === 'es' ? 'Sesión en 1 hora' : 'Session in 1 hour',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session commence bientôt`
        : locale === 'es'
          ? `Tu sesión comienza pronto`
          : `Your session starts soon`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session dans 1 heure`
        : locale === 'es'
          ? `Sesión en 1 hora`
          : `Session in 1 hour`,
  },

  session_cancelled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session annulée' : locale === 'es' ? 'Sesión cancelada' : 'Session cancelled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre session du ${m.scheduledAt} a été annulée`
        : locale === 'es'
          ? `Tu sesión del ${m.scheduledAt} ha sido cancelada`
          : `Your session on ${m.scheduledAt} has been cancelled`,
    actionUrl: () => '/sessions',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session annulée: ${m.scheduledAt}`
        : locale === 'es'
          ? `Sesión cancelada: ${m.scheduledAt}`
          : `Session cancelled: ${m.scheduledAt}`,
  },

  session_rescheduled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session reprogrammée' : locale === 'es' ? 'Sesión reprogramada' : 'Session rescheduled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle date proposée: ${m.newTime}`
        : locale === 'es'
          ? `Nueva fecha propuesta: ${m.newTime}`
          : `New proposed time: ${m.newTime}`,
    actionUrl: (m) => `/sessions/${m.sessionId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Session reprogrammée`
        : locale === 'es'
          ? `Sesión reprogramada`
          : `Session rescheduled`,
  },

  booking_confirmed: {
    title: (m, locale) =>
      locale === 'fr' ? 'Réservation confirmée' : locale === 'es' ? 'Reserva confirmada' : 'Booking confirmed',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre ${m.sessionType} est confirmé pour le ${m.scheduledAt}`
        : locale === 'es'
          ? `Tu ${m.sessionType} está confirmado para el ${m.scheduledAt}`
          : `Your ${m.sessionType} is confirmed for ${m.scheduledAt}`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Réservation confirmée: ${m.scheduledAt}`
        : locale === 'es'
          ? `Reserva confirmada: ${m.scheduledAt}`
          : `Booking confirmed: ${m.scheduledAt}`,
  },

  booking_cancelled: {
    title: (m, locale) =>
      locale === 'fr' ? 'Réservation annulée' : locale === 'es' ? 'Reserva cancelada' : 'Booking cancelled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre réservation du ${m.scheduledAt} a été annulée`
        : locale === 'es'
          ? `Tu reserva del ${m.scheduledAt} ha sido cancelada`
          : `Your booking on ${m.scheduledAt} has been cancelled`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Réservation annulée`
        : locale === 'es'
          ? `Reserva cancelada`
          : `Booking cancelled`,
  },

  booking_cancelled_by_member: {
    title: (m, locale) =>
      locale === 'fr' ? 'Séance annulée par le patient' : locale === 'es' ? 'Sesión cancelada por el paciente' : 'Session cancelled by patient',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} a annulé sa séance du ${m.scheduledAt}.\nRaison : ${m.reason}`
        : locale === 'es'
          ? `${m.clientName} canceló su sesión del ${m.scheduledAt}.\nRazón: ${m.reason}`
          : `${m.clientName} cancelled their session on ${m.scheduledAt}.\nReason: ${m.reason}`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} a annulé sa séance`
        : locale === 'es'
          ? `${m.clientName} canceló su sesión`
          : `${m.clientName} cancelled their session`,
  },

  booking_rescheduled_by_member: {
    title: (m, locale) =>
      locale === 'fr' ? 'Séance reprogrammée par le patient' : locale === 'es' ? 'Sesión reprogramada por el paciente' : 'Session rescheduled by patient',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} a reprogrammé sa séance du ${m.originalTime} au ${m.newTime}.\nRaison : ${m.reason}`
        : locale === 'es'
          ? `${m.clientName} reprogramó su sesión del ${m.originalTime} al ${m.newTime}.\nRazón: ${m.reason}`
          : `${m.clientName} rescheduled their session from ${m.originalTime} to ${m.newTime}.\nReason: ${m.reason}`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} a reprogrammé sa séance`
        : locale === 'es'
          ? `${m.clientName} reprogramó su sesión`
          : `${m.clientName} rescheduled their session`,
  },

  booking_rescheduled_by_practitioner: {
    title: (m, locale) =>
      locale === 'fr' ? 'Votre séance a été reprogrammée' : locale === 'es' ? 'Su sesión ha sido reprogramada' : 'Your session has been rescheduled',
    body: (m, locale) =>
      locale === 'fr'
        ? `Votre séance du ${m.originalTime} a été reprogrammée au ${m.newTime}.${m.reason ? `\nRaison : ${m.reason}` : ''}`
        : locale === 'es'
          ? `Su sesión del ${m.originalTime} ha sido reprogramada al ${m.newTime}.${m.reason ? `\nRazón: ${m.reason}` : ''}`
          : `Your session on ${m.originalTime} has been rescheduled to ${m.newTime}.${m.reason ? `\nReason: ${m.reason}` : ''}`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Votre séance a été reprogrammée`
        : locale === 'es'
          ? `Su sesión ha sido reprogramada`
          : `Your session has been rescheduled`,
  },

  weekly_summary: {
    title: (m, locale) =>
      locale === 'fr' ? 'Votre semaine en résumé' : locale === 'es' ? 'Tu semana en resumen' : 'Your week in review',
    body: (m, locale) =>
      locale === 'fr'
        ? `Découvrez vos progrès et insights de la semaine`
        : locale === 'es'
          ? `Descubre tu progreso y reflexiones de la semana`
          : `See your progress and insights from this week`,
    actionUrl: () => '/progress',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Votre résumé hebdomadaire`
        : locale === 'es'
          ? `Tu resumen semanal`
          : `Your weekly summary`,
  },

  ritual_reminder: {
    title: (m, locale) =>
      locale === 'fr' ? 'Rappel de rituel' : locale === 'es' ? 'Recordatorio de ritual' : 'Ritual reminder',
    body: (m, locale) =>
      locale === 'fr'
        ? `N'oubliez pas votre rituel: ${m.ritualName}`
        : locale === 'es'
          ? `No olvides tu ritual: ${m.ritualName}`
          : `Do not forget your ritual: ${m.ritualName}`,
    actionUrl: () => '/rituals',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Rappel: ${m.ritualName}`
        : locale === 'es'
          ? `Recordatorio: ${m.ritualName}`
          : `Reminder: ${m.ritualName}`,
  },

  bloom_checkin: {
    title: (m, locale) =>
      locale === 'fr' ? 'Bloom veut prendre de vos nouvelles' : locale === 'es' ? 'Bloom quiere saber cómo estás' : 'Bloom wants to check in',
    body: (m, locale) =>
      locale === 'fr'
        ? `Comment allez-vous aujourd'hui?`
        : locale === 'es'
          ? `¿Cómo estás hoy?`
          : `How are you doing today?`,
    actionUrl: () => '/home',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Comment allez-vous?`
        : locale === 'es'
          ? `¿Cómo estás?`
          : `How are you?`,
  },

  // ============================================
  // B2B - Practitioner Notifications
  // ============================================

  resource_submitted: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle soumission' : locale === 'es' ? 'Nuevo envío' : 'New submission',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a soumis "${m.resourceTitle}"`
        : locale === 'es'
          ? `${m.memberName} envió "${m.resourceTitle}"`
          : `${m.memberName} submitted "${m.resourceTitle}"`,
    actionUrl: (m) => `/resources/${m.resourceId}/responses/${m.responseId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a soumis ${m.resourceTitle}`
        : locale === 'es'
          ? `${m.memberName} envió ${m.resourceTitle}`
          : `${m.memberName} submitted ${m.resourceTitle}`,
  },

  resource_started: {
    title: (m, locale) =>
      locale === 'fr' ? 'Ressource commencée' : locale === 'es' ? 'Recurso iniciado' : 'Resource started',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a commencé "${m.resourceTitle}"`
        : locale === 'es'
          ? `${m.memberName} comenzó "${m.resourceTitle}"`
          : `${m.memberName} started "${m.resourceTitle}"`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a commencé ${m.resourceTitle}`
        : locale === 'es'
          ? `${m.memberName} comenzó ${m.resourceTitle}`
          : `${m.memberName} started ${m.resourceTitle}`,
  },

  booking_request: {
    title: (m, locale) =>
      locale === 'fr' ? 'Nouvelle demande de réservation' : locale === 'es' ? 'Nueva solicitud de reserva' : 'New booking request',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.clientName} demande un ${m.sessionType} le ${m.requestedTime}`
        : locale === 'es'
          ? `${m.clientName} solicitó un ${m.sessionType} el ${m.requestedTime}`
          : `${m.clientName} requested a ${m.sessionType} on ${m.requestedTime}`,
    actionUrl: () => '/bookings',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `Nouvelle réservation de ${m.clientName}`
        : locale === 'es'
          ? `Nueva reserva de ${m.clientName}`
          : `New booking from ${m.clientName}`,
  },

  session_confirmed: {
    title: (m, locale) =>
      locale === 'fr' ? 'Session confirmée' : locale === 'es' ? 'Sesión confirmada' : 'Session confirmed',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a confirmé la session du ${m.scheduledAt}`
        : locale === 'es'
          ? `${m.memberName} confirmó la sesión del ${m.scheduledAt}`
          : `${m.memberName} confirmed the session on ${m.scheduledAt}`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a confirmé la session`
        : locale === 'es'
          ? `${m.memberName} confirmó la sesión`
          : `${m.memberName} confirmed the session`,
  },

  reschedule_requested: {
    title: (m, locale) =>
      locale === 'fr' ? 'Demande de report' : locale === 'es' ? 'Solicitud de reprogramación' : 'Reschedule requested',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} demande à reporter la session du ${m.originalTime}`
        : locale === 'es'
          ? `${m.memberName} solicitó reprogramar la sesión del ${m.originalTime}`
          : `${m.memberName} requested to reschedule the session on ${m.originalTime}`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} demande un report`
        : locale === 'es'
          ? `${m.memberName} solicitó una reprogramación`
          : `${m.memberName} requested a reschedule`,
  },

  member_invitation_accepted: {
    title: (m, locale) =>
      locale === 'fr' ? 'Invitation acceptée' : locale === 'es' ? 'Invitación aceptada' : 'Invitation accepted',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a rejoint votre espace`
        : locale === 'es'
          ? `${m.memberName} se unió a tu espacio`
          : `${m.memberName} joined your practice`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a accepté votre invitation`
        : locale === 'es'
          ? `${m.memberName} aceptó tu invitación`
          : `${m.memberName} accepted your invitation`,
  },

  member_invitation_rejected: {
    title: (m, locale) =>
      locale === 'fr' ? 'Invitation déclinée' : locale === 'es' ? 'Invitación rechazada' : 'Invitation declined',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a décliné votre invitation`
        : locale === 'es'
          ? `${m.memberName} rechazó tu invitación`
          : `${m.memberName} declined your invitation`,
    actionUrl: () => '/members',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} a décliné l'invitation`
        : locale === 'es'
          ? `${m.memberName} rechazó la invitación`
          : `${m.memberName} declined the invitation`,
  },

  member_inactive: {
    title: (m, locale) =>
      locale === 'fr' ? 'Membre inactif' : locale === 'es' ? 'Miembro inactivo' : 'Inactive member',
    body: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} n'a pas été actif depuis ${m.daysSinceActive} jours`
        : locale === 'es'
          ? `${m.memberName} ha estado inactivo durante ${m.daysSinceActive} días`
          : `${m.memberName} has been inactive for ${m.daysSinceActive} days`,
    actionUrl: (m) => `/members/${m.memberId}`,
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.memberName} est inactif`
        : locale === 'es'
          ? `${m.memberName} está inactivo`
          : `${m.memberName} is inactive`,
  },

  member_welcome: {
    title: (m, locale) =>
      locale === 'fr' ? 'Bienvenue sur Bloomsline' : locale === 'es' ? 'Bienvenido a Bloomsline' : 'Welcome to Bloomsline',
    body: (m, locale) =>
      locale === 'fr'
        ? `Bonjour ${m.memberName},\n\n${m.practitionerName} utilise Bloomsline pour partager des ressources thérapeutiques avec vous entre vos séances.\n\nVous pourrez recevoir des exercices, des fiches de travail et des rappels de séance via cette plateforme.\n\nBloomsline est un espace sécurisé et confidentiel, conforme au RGPD. Vos données sont protégées.\n\nSi vous avez des questions, contactez directement ${m.practitionerName}.`
        : locale === 'es'
          ? `Hola ${m.memberName},\n\n${m.practitionerName} usa Bloomsline para compartir recursos terapéuticos contigo entre sesiones.\n\nPodrás recibir ejercicios y recordatorios a través de esta plataforma.\n\nBloomsline es un espacio seguro y confidencial.\n\nSi tienes preguntas, contacta directamente a ${m.practitionerName}.`
          : `Hi ${m.memberName},\n\n${m.practitionerName} uses Bloomsline to share therapeutic resources with you between sessions.\n\nYou may receive exercises, worksheets, and session reminders through this platform.\n\nBloomsline is a secure and confidential space, GDPR-compliant. Your data is protected.\n\nIf you have any questions, contact ${m.practitionerName} directly.`,
    actionUrl: () => '/',
    emailSubject: (m, locale) =>
      locale === 'fr'
        ? `${m.practitionerName} vous invite sur Bloomsline`
        : locale === 'es'
          ? `${m.practitionerName} te invita a Bloomsline`
          : `${m.practitionerName} invites you to Bloomsline`,
  },
}

/**
 * Get notification content from template
 */
export function getNotificationContent(
  type: NotificationType,
  metadata: Record<string, unknown>,
  locale: 'en' | 'fr' | 'es' = 'en'
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

// ============================================
// Notification System Exports
// ============================================

// Types
export * from './types'

// Templates
export { getNotificationContent, templates } from './templates'

// Service
export {
  createNotificationService,
  notifyResourceShared,
  notifyResourceSubmitted,
  notifySessionScheduled,
  notifyBookingRequest,
  notifyRescheduleRequested,
  notifyMemberInvitationAccepted,
} from './service'

// Email
export { sendEmail, getEmailContent } from './email'

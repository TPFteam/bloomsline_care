// ============================================
// Notification Types & Definitions
// ============================================

export type NotificationType =
  // B2C - Member Notifications
  | 'resource_shared'
  | 'resource_assigned'
  | 'assignment_due_soon'
  | 'assignment_overdue'
  | 'session_scheduled'
  | 'session_reminder_24h'
  | 'session_reminder_1h'
  | 'session_cancelled'
  | 'session_rescheduled'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'weekly_summary'
  | 'ritual_reminder'
  | 'bloom_checkin'
  // B2B - Practitioner Notifications
  | 'resource_submitted'
  | 'story_shared'
  | 'resource_started'
  | 'booking_request'
  | 'session_confirmed'
  | 'reschedule_requested'
  | 'booking_cancelled_by_member'
  | 'booking_rescheduled_by_member'
  | 'booking_rescheduled_by_practitioner'
  | 'member_invitation_accepted'
  | 'member_invitation_rejected'
  | 'member_inactive'
  | 'member_welcome'

export type UserType = 'practitioner' | 'member'

export type DeliveryChannel = 'email' | 'push' | 'sms'

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'

export type EntityType = 'resource' | 'session' | 'booking' | 'member' | 'resource_response' | 'assignment'

export interface Notification {
  id: string
  user_id: string
  user_type: UserType
  type: NotificationType
  title: string
  body: string
  entity_type?: EntityType
  entity_id?: string
  metadata: Record<string, unknown>
  action_url?: string
  read: boolean
  read_at?: string
  created_at: string
}

export interface NotificationDelivery {
  id: string
  notification_id: string
  channel: DeliveryChannel
  status: DeliveryStatus
  recipient_address?: string
  external_id?: string
  error_message?: string
  scheduled_at: string
  sent_at?: string
  delivered_at?: string
  created_at: string
}

export interface NotificationPreferences {
  user_id: string
  user_type: UserType
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  preferences: Record<NotificationType, { email: boolean; push: boolean }>
  updated_at: string
}

export interface PushToken {
  id: string
  user_id: string
  token: string
  platform: 'ios' | 'android' | 'web'
  device_id?: string
  device_name?: string
  is_active: boolean
  last_used_at: string
  created_at: string
}

// ============================================
// Notification Payloads (for creating notifications)
// ============================================

export interface CreateNotificationPayload {
  userId: string
  userType: UserType
  type: NotificationType
  entityType?: EntityType
  entityId?: string
  metadata?: Record<string, unknown>
  channels?: DeliveryChannel[]
}

// Specific payload types for each notification
export interface ResourceSharedPayload extends CreateNotificationPayload {
  type: 'resource_shared'
  metadata: {
    resourceId: string
    resourceTitle: string
    resourceType: string
    practitionerName: string
    message?: string
  }
}

export interface ResourceAssignedPayload extends CreateNotificationPayload {
  type: 'resource_assigned'
  metadata: {
    assignmentId: string
    resourceId: string
    resourceTitle: string
    resourceType: string
    practitionerName: string
    dueDate?: string
    instructions?: string
  }
}

export interface SessionScheduledPayload extends CreateNotificationPayload {
  type: 'session_scheduled'
  metadata: {
    sessionId: string
    scheduledAt: string
    practitionerName?: string
    memberName?: string
    sessionType?: string
  }
}

export interface BookingRequestPayload extends CreateNotificationPayload {
  type: 'booking_request'
  metadata: {
    bookingId: string
    clientName: string
    clientEmail: string
    sessionType: string
    requestedTime: string
    notes?: string
  }
}

export interface ResourceSubmittedPayload extends CreateNotificationPayload {
  type: 'resource_submitted'
  metadata: {
    responseId: string
    resourceId: string
    resourceTitle: string
    memberName: string
    submittedAt: string
  }
}

export interface RescheduleRequestedPayload extends CreateNotificationPayload {
  type: 'reschedule_requested'
  metadata: {
    sessionId: string
    memberName: string
    originalTime: string
    reason?: string
  }
}

export interface MemberInvitationPayload extends CreateNotificationPayload {
  type: 'member_invitation_accepted' | 'member_invitation_rejected'
  metadata: {
    memberId: string
    memberName: string
    memberEmail: string
  }
}

// Union type for all payloads
export type NotificationPayload =
  | ResourceSharedPayload
  | ResourceAssignedPayload
  | SessionScheduledPayload
  | BookingRequestPayload
  | ResourceSubmittedPayload
  | RescheduleRequestedPayload
  | MemberInvitationPayload
  | CreateNotificationPayload

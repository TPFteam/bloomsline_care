// ============================================
// Notification Service
// Core service for creating and managing notifications
// ============================================

import { SupabaseClient } from '@supabase/supabase-js'
import { getNotificationContent } from './templates'
import type {
  NotificationType,
  UserType,
  EntityType,
  Notification,
  NotificationPreferences,
  DeliveryChannel,
} from './types'

interface SendNotificationParams {
  userId: string
  userType: UserType
  type: NotificationType
  metadata: Record<string, unknown>
  entityType?: EntityType
  entityId?: string
  locale?: 'en' | 'fr'
  channels?: DeliveryChannel[] // Override default channels
}

interface NotificationService {
  send: (params: SendNotificationParams) => Promise<Notification | null>
  queueDelivery: (notificationId: string, channel: DeliveryChannel, userId: string) => Promise<void>
  getNotifications: (userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => Promise<Notification[]>
  getUnreadCount: (userId: string) => Promise<number>
  markAsRead: (notificationId: string, userId: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  getPreferences: (userId: string) => Promise<NotificationPreferences | null>
  updatePreferences: (userId: string, preferences: Partial<NotificationPreferences>) => Promise<void>
}

/**
 * Create notification service instance
 */
export function createNotificationService(supabase: SupabaseClient): NotificationService {
  return {
    /**
     * Send a notification to a user
     */
    async send(params: SendNotificationParams): Promise<Notification | null> {
      const {
        userId,
        userType,
        type,
        metadata,
        entityType,
        entityId,
        locale = 'en',
        channels,
      } = params

      try {
        // Get notification content from template
        const content = getNotificationContent(type, metadata, locale)

        // Create the notification record
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            user_type: userType,
            type,
            title: content.title,
            body: content.body,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            action_url: content.actionUrl,
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating notification:', JSON.stringify(error, null, 2))
          console.error('Error code:', error.code)
          console.error('Error message:', error.message)
          console.error('Error details:', error.details)
          return null
        }

        // Get user preferences to determine delivery channels
        const preferences = await this.getPreferences(userId)
        const typePrefs = preferences?.preferences?.[type] || { email: true, push: true }

        // Determine which channels to use
        const deliveryChannels = channels || []
        if (!channels) {
          if (preferences?.email_enabled && typePrefs.email) {
            deliveryChannels.push('email')
          }
          if (preferences?.push_enabled && typePrefs.push) {
            deliveryChannels.push('push')
          }
        }

        // Queue deliveries for each channel
        for (const channel of deliveryChannels) {
          await this.queueDelivery(notification.id, channel, userId)
        }

        return notification
      } catch (error) {
        console.error('Error in send notification:', error)
        return null
      }
    },

    /**
     * Queue a delivery for a notification
     */
    async queueDelivery(
      notificationId: string,
      channel: DeliveryChannel,
      userId: string
    ): Promise<void> {
      try {
        // Get user's email for email delivery
        let recipientAddress: string | undefined

        if (channel === 'email') {
          const { data: user } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', userId)
            .single()
          recipientAddress = user?.email
        }

        await supabase.from('notification_deliveries').insert({
          notification_id: notificationId,
          channel,
          status: 'pending',
          recipient_address: recipientAddress,
        })
      } catch (error) {
        console.error('Error queuing delivery:', error)
      }
    },

    /**
     * Get notifications for a user
     */
    async getNotifications(
      userId: string,
      options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
    ): Promise<Notification[]> {
      const { limit = 50, offset = 0, unreadOnly = false } = options

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (unreadOnly) {
        query = query.eq('read', false)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error marking notification as read:', error)
      }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all as read:', error)
      }
    },

    /**
     * Get user's notification preferences
     */
    async getPreferences(userId: string): Promise<NotificationPreferences | null> {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching preferences:', error)
      }

      return data || null
    },

    /**
     * Update user's notification preferences
     */
    async updatePreferences(
      userId: string,
      preferences: Partial<NotificationPreferences>
    ): Promise<void> {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error updating preferences:', error)
      }
    },
  }
}

// ============================================
// Helper Functions for Triggering Notifications
// ============================================

/**
 * Send notification via API (bypasses RLS)
 */
async function sendNotificationViaAPI(params: {
  userId: string
  userType: UserType
  type: NotificationType
  metadata: Record<string, unknown>
  entityType?: EntityType
  entityId?: string
  recipientEmail?: string
}): Promise<void> {
  try {
    // Get the current session token for auth
    const { createClient } = await import('@/lib/supabase/browser-client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send notification:', error)
    }
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

/**
 * Send resource shared notification
 */
export async function notifyResourceShared(
  _supabase: SupabaseClient,
  params: {
    memberId: string
    memberUserId: string
    resourceId: string
    resourceTitle: string
    resourceType: string
    practitionerName: string
    message?: string
    memberEmail?: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.memberUserId,
    userType: 'member',
    type: 'resource_shared',
    entityType: 'resource',
    entityId: params.resourceId,
    metadata: {
      resourceId: params.resourceId,
      resourceTitle: params.resourceTitle,
      resourceType: params.resourceType,
      practitionerName: params.practitionerName,
      message: params.message,
    },
    recipientEmail: params.memberEmail,
  })
}

/**
 * Send resource shared email directly (for members without an account)
 * Includes a preview link with share token
 */
export async function sendResourceSharedEmail(params: {
  memberEmail: string
  resourceTitle: string
  resourceType: string
  practitionerName: string
  resourceId: string
  shareToken?: string
}): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/browser-client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch('/api/notifications/email-only', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'resource_shared',
        email: params.memberEmail,
        metadata: {
          resourceTitle: params.resourceTitle,
          resourceType: params.resourceType,
          practitionerName: params.practitionerName,
          resourceId: params.resourceId,
        },
        shareToken: params.shareToken,
      }),
    })

    if (!response.ok) {
      console.error('Failed to send direct email:', await response.json())
    }
  } catch (error) {
    console.error('Error sending direct email:', error)
  }
}

/**
 * Send resource submitted notification
 */
export async function notifyResourceSubmitted(
  _supabase: SupabaseClient,
  params: {
    practitionerUserId: string
    memberId: string
    memberName: string
    resourceId: string
    resourceTitle: string
    responseId: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.practitionerUserId,
    userType: 'practitioner',
    type: 'resource_submitted',
    entityType: 'resource_response',
    entityId: params.responseId,
    metadata: {
      memberId: params.memberId,
      memberName: params.memberName,
      resourceId: params.resourceId,
      resourceTitle: params.resourceTitle,
      responseId: params.responseId,
      submittedAt: new Date().toISOString(),
    },
  })
}

/**
 * Send session scheduled notification
 */
export async function notifySessionScheduled(
  _supabase: SupabaseClient,
  params: {
    memberUserId: string
    sessionId: string
    scheduledAt: string
    practitionerName: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.memberUserId,
    userType: 'member',
    type: 'session_scheduled',
    entityType: 'session',
    entityId: params.sessionId,
    metadata: {
      sessionId: params.sessionId,
      scheduledAt: params.scheduledAt,
      practitionerName: params.practitionerName,
    },
  })
}

/**
 * Send booking request notification
 */
export async function notifyBookingRequest(
  _supabase: SupabaseClient,
  params: {
    practitionerUserId: string
    bookingId: string
    clientName: string
    clientEmail: string
    sessionType: string
    requestedTime: string
    notes?: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.practitionerUserId,
    userType: 'practitioner',
    type: 'booking_request',
    entityType: 'booking',
    entityId: params.bookingId,
    metadata: {
      bookingId: params.bookingId,
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      sessionType: params.sessionType,
      requestedTime: params.requestedTime,
      notes: params.notes,
    },
  })
}

/**
 * Send reschedule requested notification
 */
export async function notifyRescheduleRequested(
  _supabase: SupabaseClient,
  params: {
    practitionerUserId: string
    sessionId: string
    memberId: string
    memberName: string
    originalTime: string
    reason?: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.practitionerUserId,
    userType: 'practitioner',
    type: 'reschedule_requested',
    entityType: 'session',
    entityId: params.sessionId,
    metadata: {
      sessionId: params.sessionId,
      memberId: params.memberId,
      memberName: params.memberName,
      originalTime: params.originalTime,
      reason: params.reason,
    },
  })
}

/**
 * Send member invitation accepted notification
 */
export async function notifyMemberInvitationAccepted(
  _supabase: SupabaseClient,
  params: {
    practitionerUserId: string
    memberId: string
    memberName: string
    memberEmail: string
  }
): Promise<void> {
  await sendNotificationViaAPI({
    userId: params.practitionerUserId,
    userType: 'practitioner',
    type: 'member_invitation_accepted',
    entityType: 'member',
    entityId: params.memberId,
    metadata: {
      memberId: params.memberId,
      memberName: params.memberName,
      memberEmail: params.memberEmail,
    },
  })
}

# Notification System Plan

## Overview

A comprehensive notification system for Bloomsline Care covering both B2B (Practitioner) and B2C (Member) sides with multiple delivery channels.

---

## All Notification Types

### B2C (Member Notifications)

| Event | Trigger | Channels | Priority |
|-------|---------|----------|----------|
| **Resource Shared** | Practitioner shares worksheet/resource | Email, Push, In-App | High |
| **Resource Assigned** | Practitioner assigns resource with due date | Email, Push, In-App | High |
| **Assignment Due Soon** | 24h before due date | Push, In-App | Medium |
| **Assignment Overdue** | Past due date | Email, Push | Medium |
| **Session Scheduled** | Practitioner schedules session | Email, Push, In-App | High |
| **Session Reminder 24h** | 24 hours before session | Email, Push | High |
| **Session Reminder 1h** | 1 hour before session | Push | High |
| **Session Cancelled** | Practitioner cancels session | Email, Push, In-App | High |
| **Session Rescheduled** | Practitioner proposes new time | Email, Push, In-App | High |
| **Booking Confirmed** | Booking status changed to confirmed | Email, Push | High |
| **Booking Cancelled** | Booking cancelled by practitioner | Email, Push | High |
| **Practitioner Message** | Direct message from practitioner | Push, In-App | Medium |
| **Weekly Summary** | Weekly wellness summary ready | Email, Push | Low |
| **Ritual Reminder** | Daily ritual reminder | Push | Medium |
| **Bloom Check-in** | Periodic Bloom wellness check | Push | Low |

### B2B (Practitioner Notifications)

| Event | Trigger | Channels | Priority |
|-------|---------|----------|----------|
| **Resource Submitted** | Member submits worksheet/assessment | Email, Push, In-App | High |
| **Resource Started** | Member starts working on resource | In-App | Low |
| **New Booking Request** | Client requests booking (pending) | Email, Push, In-App | High |
| **Booking Confirmed** | Client confirms booking | In-App | Medium |
| **Booking Cancelled** | Client cancels booking | Email, Push, In-App | High |
| **Session Confirmed** | Member confirms scheduled session | In-App | Medium |
| **Session Reschedule Requested** | Member requests to reschedule | Email, Push, In-App | High |
| **Member Invitation Accepted** | Member accepts invite and joins | Email, In-App | Medium |
| **Member Invitation Rejected** | Member rejects invite | In-App | Low |
| **Member Inactive** | Member inactive for X days | Email, In-App | Medium |
| **Member Completed Onboarding** | New member finishes onboarding | In-App | Low |
| **Session Reminder 24h** | Upcoming session with member | Push | Medium |
| **Payment Received** | Payment processed (future) | Email, In-App | Medium |
| **Subscription Update** | Plan changed/renewed (future) | Email | Medium |

---

## Database Schema

### 1. Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('practitioner', 'member')),

  -- Notification Content
  type TEXT NOT NULL, -- 'resource_shared', 'session_scheduled', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Related Entity
  entity_type TEXT, -- 'resource', 'session', 'booking', 'member'
  entity_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Extra data like practitioner name, resource title, etc.
  action_url TEXT, -- Deep link to relevant page

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT idx_notifications_user_id_created_at
    UNIQUE (user_id, created_at DESC)
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
```

### 2. Notification Deliveries Table (for tracking)

```sql
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

  -- Delivery Info
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),

  -- Delivery Details
  recipient_address TEXT, -- Email or phone
  external_id TEXT, -- SendGrid message ID, FCM ID, etc.
  error_message TEXT,

  -- Timestamps
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_status ON notification_deliveries(status) WHERE status = 'pending';
```

### 3. Notification Preferences Table

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('practitioner', 'member')),

  -- Global Settings
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,

  -- Quiet Hours
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '08:00'
  timezone TEXT DEFAULT 'UTC',

  -- Per-Type Preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{
    "resource_shared": {"email": true, "push": true},
    "resource_assigned": {"email": true, "push": true},
    "assignment_due_soon": {"email": false, "push": true},
    "session_scheduled": {"email": true, "push": true},
    "session_reminder_24h": {"email": true, "push": true},
    "session_reminder_1h": {"email": false, "push": true},
    "booking_request": {"email": true, "push": true},
    "resource_submitted": {"email": true, "push": true},
    "member_inactive": {"email": true, "push": false},
    "weekly_summary": {"email": true, "push": false},
    "ritual_reminder": {"email": false, "push": true}
  }',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Push Tokens Table

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT, -- For managing multiple devices

  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id) WHERE is_active = TRUE;
```

---

## Architecture

### Notification Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Trigger       │────▶│  Notification    │────▶│   Delivery      │
│   (Event)       │     │  Service         │     │   Queue         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
                 ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
                 │    Email     │               │    Push      │               │   In-App     │
                 │  (SendGrid)  │               │   (FCM)      │               │  (Realtime)  │
                 └──────────────┘               └──────────────┘               └──────────────┘
```

### Services Stack

1. **Email**: Resend (modern, developer-friendly, great for Next.js)
2. **Push Notifications**: Firebase Cloud Messaging (free, cross-platform)
3. **In-App**: Supabase Realtime (already using Supabase)
4. **Background Jobs**: Vercel Cron + Edge Functions (no extra infra)

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create database tables (notifications, deliveries, preferences, push_tokens)
- [ ] Create notification service (`/src/lib/services/notifications.ts`)
- [ ] Create notification types and templates
- [ ] Set up SendGrid integration for email
- [ ] Create API routes for notifications

### Phase 2: In-App Notifications (Week 1-2)
- [ ] Create notification bell component
- [ ] Create notifications dropdown/panel
- [ ] Add real-time updates via Supabase
- [ ] Add mark as read functionality
- [ ] Add notification preferences page

### Phase 3: Email Notifications (Week 2)
- [ ] Design email templates (HTML)
- [ ] Implement email sending for all notification types
- [ ] Add unsubscribe links
- [ ] Test email deliverability

### Phase 4: Push Notifications (Week 3)
- [ ] Set up Firebase project
- [ ] Add push token registration
- [ ] Implement push sending
- [ ] Add service worker for web push
- [ ] Handle iOS/Android deep links

### Phase 5: Triggers & Automation (Week 3-4)
- [ ] Add triggers for resource sharing
- [ ] Add triggers for session scheduling
- [ ] Add triggers for booking events
- [ ] Add triggers for submissions
- [ ] Add scheduled jobs for reminders

### Phase 6: Polish & Preferences (Week 4)
- [ ] Build notification settings UI
- [ ] Add quiet hours support
- [ ] Add per-type preferences
- [ ] Add delivery tracking analytics

---

## File Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── notifications.ts        # Core notification service
│   │   ├── email.ts                # SendGrid integration
│   │   └── push.ts                 # FCM integration
│   ├── notifications/
│   │   ├── types.ts                # Notification type definitions
│   │   ├── templates.ts            # Email/push templates
│   │   └── triggers.ts             # Event trigger handlers
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx    # Bell icon with badge
│   │   ├── NotificationPanel.tsx   # Dropdown panel
│   │   ├── NotificationItem.tsx    # Single notification
│   │   └── NotificationSettings.tsx # Preferences UI
├── hooks/
│   └── useNotifications.ts         # React hook for notifications
├── app/
│   ├── api/
│   │   ├── notifications/
│   │   │   ├── route.ts            # GET notifications
│   │   │   ├── [id]/route.ts       # Mark as read
│   │   │   ├── preferences/route.ts # Get/update preferences
│   │   │   └── register-push/route.ts # Register push token
│   │   └── webhooks/
│   │       └── sendgrid/route.ts   # Email delivery webhooks
```

---

## Notification Templates

### Email Templates Needed

1. **Resource Shared**
   - Subject: "[Practitioner Name] shared a resource with you"
   - Body: Resource title, optional message, CTA button

2. **Session Scheduled**
   - Subject: "Your session is scheduled for [Date]"
   - Body: Date, time, practitioner name, confirm/reschedule buttons

3. **Session Reminder**
   - Subject: "Reminder: Session tomorrow at [Time]"
   - Body: Details, add to calendar link

4. **Assignment Due**
   - Subject: "Reminder: [Resource] is due tomorrow"
   - Body: Resource title, due date, complete button

5. **Submission Received** (for practitioner)
   - Subject: "[Member] submitted [Resource]"
   - Body: Member name, resource title, view submission button

6. **Booking Confirmed**
   - Subject: "Your booking is confirmed for [Date]"
   - Body: All booking details, calendar links

7. **Weekly Summary** (for member)
   - Subject: "Your weekly wellness summary"
   - Body: Key stats, Bloom insights, encouragement

---

## API Endpoints

### Notifications

```
GET  /api/notifications              # List user's notifications
GET  /api/notifications/unread-count # Get unread count
POST /api/notifications/[id]/read    # Mark as read
POST /api/notifications/mark-all-read # Mark all as read
```

### Preferences

```
GET  /api/notifications/preferences  # Get preferences
PUT  /api/notifications/preferences  # Update preferences
```

### Push Registration

```
POST /api/notifications/register-push    # Register push token
DELETE /api/notifications/register-push  # Unregister token
```

---

## Trigger Integration Points

### 1. Resource Sharing
**File**: `src/lib/services/member-resources.ts`
```typescript
// After sharing resource
await notificationService.send({
  type: 'resource_shared',
  userId: member.user_id,
  entityType: 'resource',
  entityId: resourceId,
  metadata: { resourceTitle, practitionerName, message }
})
```

### 2. Session Scheduling
**File**: `src/components/schedule-session-modal.tsx`
```typescript
// After creating session
await notificationService.send({
  type: 'session_scheduled',
  userId: member.user_id,
  entityType: 'session',
  entityId: sessionId,
  metadata: { scheduledAt, practitionerName }
})
```

### 3. Booking Events
**File**: `src/app/api/bookings/route.ts`
```typescript
// On booking creation
await notificationService.send({
  type: 'booking_request',
  userId: practitionerId,
  entityType: 'booking',
  entityId: bookingId,
  metadata: { clientName, sessionType, requestedTime }
})
```

### 4. Resource Submission
**File**: Database trigger or `src/app/api/resources/submit/route.ts`
```typescript
// On submission
await notificationService.send({
  type: 'resource_submitted',
  userId: practitionerId,
  entityType: 'resource_response',
  entityId: responseId,
  metadata: { memberName, resourceTitle }
})
```

---

## Reminder Cron Jobs

Using Vercel Cron or similar:

```typescript
// /api/cron/session-reminders
// Runs every hour
// Finds sessions in next 24h, sends reminders

// /api/cron/assignment-due
// Runs daily at 9am
// Finds assignments due in 24h, sends reminders

// /api/cron/ritual-reminders
// Runs at user's preferred time
// Sends daily ritual reminders

// /api/cron/weekly-summary
// Runs every Sunday
// Generates and sends weekly summaries
```

---

## Dependencies to Add

```json
{
  "resend": "^2.0.0",
  "firebase-admin": "^12.0.0"
}
```

---

## Environment Variables Needed

```env
# Resend (Email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=Bloomsline Care <notifications@bloomsline.care>

# Firebase (for Push)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=https://app.bloomsline.care
```

---

## Summary

This plan covers:
- **15+ B2C notification types** (member-facing)
- **12+ B2B notification types** (practitioner-facing)
- **3 delivery channels** (Email, Push, In-App)
- **Real-time in-app notifications** via Supabase
- **User preferences** with quiet hours
- **Delivery tracking** for analytics
- **Scalable architecture** using existing infrastructure

The implementation can be done in 4 weeks, with core functionality (in-app + email) ready in 2 weeks.

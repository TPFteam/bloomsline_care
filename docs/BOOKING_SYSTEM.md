# Booking & Calendar System — Technical Reference

> Last updated: April 18, 2026
> This document captures the complete booking/calendar architecture, flows, known issues, and decisions made during development.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Booking Flows](#booking-flows)
4. [Calendar Integration](#calendar-integration)
5. [Email & Notification System](#email--notification-system)
6. [Session ↔ Booking Sync](#session--booking-sync)
7. [Slot Generation & Availability](#slot-generation--availability)
8. [Settings & Preferences](#settings--preferences)
9. [Known Issues & Decisions](#known-issues--decisions)
10. [Key Files Reference](#key-files-reference)

---

## Architecture Overview

The booking system spans two tables (`bookings` + `sessions`), Google Calendar integration, Postmark email delivery, and in-app notifications. Both the practitioner care app (Next.js) and the patient mobile app (React Native/Expo) interact with the same API endpoints.

```
Patient (mobile/web) → POST /api/bookings → bookings table
                                           → sessions table
                                           → Google Calendar event
                                           → Postmark email (booking request only)
                                           → In-app notification

Practitioner (care app) → schedule-session-modal → bookings + sessions
                        → bookings page (approve/reject/reschedule/cancel)
```

---

## Database Schema

### `bookings` table
- `session_type`: TEXT (accepts any string — practitioner's custom IDs like "initial", "follow_up")
- `session_format`: TEXT (accepts "in_person", "video", "virtual" — no enum constraint)
- `google_event_id`: links to Google Calendar event (null for manual bookings)
- `member_id`: links to members table (null for anonymous public bookings)
- `rescheduled_from`: UUID reference to the original booking when rescheduled
- `rescheduled_by`: 'member' | 'practitioner'
- `cancelled_by`: 'member' | 'practitioner'

### `sessions` table
- `session_type`: ENUM — only accepts: `initial_consultation`, `follow_up`, `check_in`, `crisis`, `group`, `other`
- `session_format`: ENUM — only accepts: `in_person`, `virtual`, `phone`
- **Important**: the enums don't match the bookings table strings! We use `toSessionEnum()` mapper and always write `'virtual'` not `'video'` to sessions.

### `booking_settings` table
- `hour_aligned_slots`: boolean — when ON, only offer :00 start times
- `allow_patient_cancel` / `allow_patient_reschedule`: boolean (default false)
- `modification_notice_hours`: integer (default 48)
- `min_notice_hours`: integer — applied to both patient and practitioner flows
- `buffer_before` / `buffer_after`: minutes
- `session_types`: JSONB array with custom session type definitions

### `availability_schedules` table
- `day_of_week`: enum (monday, tuesday, etc.)
- `session_format`: TEXT ('in_person', 'video', 'both')
- `timezone`: practitioner's timezone (e.g., 'Europe/Paris')

---

## Booking Flows

### Patient books via public page or mobile app
1. Patient visits `/practitioner/[slug]/book` or mobile booking screen
2. Selects: session type → format → date/time → details → confirm
3. `POST /api/bookings` creates the booking
4. If `require_approval` is true → status='pending', practitioner gets Bloomsline email + in-app notification
5. If `require_approval` is false → status='confirmed', Google Calendar event created with `sendUpdates=all`
6. Pre-selection: first available date is auto-selected so the calendar never opens blank

### Practitioner schedules from care app
1. Opens schedule-session modal (from member page or dashboard)
2. Two modes: **From Calendar** (uses available-slots API) or **Manual Entry** (free-form, no availability check)
3. Calendar mode: CalendarPicker + time slot chips + booking context (existing bookings shown as gray chips)
4. Manual mode: amber banner warns "No emails will be sent. No Google Calendar sync."
5. Week calendar view available (expand icon) — shows full week with clickable available slots
6. On confirm: creates booking + session + Google Calendar event (calendar mode) or just booking + session (manual mode)

### Practitioner reschedules
1. Clicks "Reschedule" on bookings page
2. Opens the schedule-session modal in **reschedule mode** — session type + format pre-filled but editable
3. Picks new date/time → calls `POST /api/bookings/[id]/reschedule`
4. Old booking cancelled, new one created with `rescheduled_from` link
5. Old Google Calendar event: description updated with reason → deleted with `sendUpdates=all`
6. New Google Calendar event created with `sendUpdates=all`

### Patient reschedules (from mobile app)
1. `POST /api/bookings/[id]/member-action` with `action: 'reschedule'`
2. Same cancel-old + create-new flow
3. Google Calendar handles notifications to both sides

### Cancellation flows
See [Email & Notification System](#email--notification-system) for the full audit.

---

## Calendar Integration

### Google Calendar event creation
All event creation paths use `buildCalendarEvent()` from `src/lib/services/calendar-event.ts`:
- Title: FR `"Rendez-vous [Practitioner] <> [Patient]"` / EN `"Appointment [Practitioner] <> [Patient]"`
- Includes: session type, client details, practitioner details, Bloomsline link
- Auto-creates Google Meet link via `conferenceDataVersion=1`
- Locale from practitioner's `preferred_language`

### Practitioner name lookup
`getPractitionerName()` in `calendar-event.ts` tries 3 sources:
1. `public.users.full_name`
2. `auth.users.user_metadata.full_name`
3. Email prefix (last resort)
Never falls back to literal "Practitioner".

### Google Calendar mismatch detection
When events are deleted from Google Calendar but bookings still exist in our DB:
- **Detection**: `GET /api/calendar/check-mismatches` checks future bookings against Google
- **Display**: amber banner on Bookings page listing mismatched sessions
- **Actions**: "Cancel" (cancels booking + session) or "Keep" (clears `google_event_id`)
- Also shown inline in the schedule-session modal's time picker as red warning chips
- **No auto-sync**: we removed `syncCancelledGoogleEvents` from available-slots to give practitioners control

### Important: `sendUpdates=all` behavior
Google's `sendUpdates=all` only notifies **attendees**, NOT the calendar **owner/organizer**. The practitioner is the organizer. So:
- Patient (attendee) gets Google emails for create/cancel/reschedule
- Practitioner (organizer) does NOT get Google emails
- For patient-initiated cancellations, we send a Bloomsline email to the practitioner (the only Bloomsline email in the cancel flow)

---

## Email & Notification System

### Complete audit (as of April 18, 2026)

| Event | Patient gets | Practitioner gets |
|---|---|---|
| Patient books (pending) | Nothing | Bloomsline email (booking request) + in-app notification |
| Patient books (auto-confirm) | Google Calendar invite | Google Calendar invite |
| Practitioner approves | Google Calendar invite | Google Calendar invite |
| Patient cancels | Google Calendar cancellation | **Bloomsline email** (only way they find out) + in-app notification |
| Practitioner cancels | Google Calendar cancellation | Nothing (they did it) |
| Either side reschedules | Google cancel old + invite new | Google cancel old + invite new |

### Cancellation reason in Google Calendar
Before deleting the event, we PATCH the description with the reason:
- `"❌ Session cancelled by [Patient] — Reason: [reason]"` (patient cancels)
- `"❌ Session cancelled — Reason: [reason]"` (practitioner cancels)
- `"⟳ Rescheduled by [who] — Reason: [reason]"` (reschedule)

### Email delivery: `waitUntil` pattern
Booking request emails use `waitUntil()` from `@vercel/functions` instead of fire-and-forget. This ensures the serverless function stays alive to complete the email delivery. Previously, fire-and-forget emails could be killed by the runtime.

### Postmark configuration
- Sender: `hi@bloomsline.com`
- Email template: `generateEmailHtml()` in `src/lib/notifications/email.ts`
- Supports: practitioner name, avatar, recipient name, action buttons

---

## Session ↔ Booking Sync

Sessions and bookings are two parallel tables matched by:
```
practitioner_id + scheduled_at = start_time + (optional) member_id
```

### All sync paths (fixed April 17, 2026)

| Action | Sessions table | Bookings table | Google Calendar |
|---|---|---|---|
| Delete from Sessions tab | Deleted | Cancelled via PATCH | Deleted via PATCH |
| Cancel from Sessions tab | Cancelled | Cancelled via PATCH | Deleted via PATCH |
| Cancel from Bookings page | Cancelled | Cancelled | Deleted |
| Delete from Google Calendar | Cancelled (via mismatch prompt) | Cancelled (via mismatch prompt) | Already gone |

### Cancel requires reason
The "Cancel session" button in SessionsTab is disabled until a reason is selected from the dropdown.

---

## Slot Generation & Availability

### Available slots API: `GET /api/bookings/available-slots`

Two paths:
- `skipNotice=true` (practitioner scheduling): TypeScript-based slot generation with format filtering
- `skipNotice=false` (patient booking): PostgreSQL RPC `get_available_slots`

Both paths:
1. Read availability schedule for the day
2. Check date overrides
3. Generate slots at 30-min intervals (or 60-min if `hour_aligned_slots` is ON)
4. Filter conflicts (bookings + sessions)
5. Apply `min_notice_hours` cutoff
6. Filter Google Calendar busy times
7. Apply buffer_before / buffer_after

### Hour-aligned slots
`booking_settings.hour_aligned_slots = true` → only offer slots starting at :00.
Applied in both the TypeScript path (Intl.DateTimeFormat minute check) and the PostgreSQL RPC (EXTRACT MINUTE check).

### Performance optimizations
- `syncCancelledGoogleEvents` removed from available-slots (was adding 1-3s per request)
- Supabase queries parallelized via `Promise.all`
- `next-available` endpoint fetches candidate days in parallel (not sequentially)

### Pre-selection
When the booking flow opens (patient or practitioner), the first available date is auto-selected client-side by scanning forward from today through `max_advance_days`, checking disabled days and format compatibility.

### Auto-advance on format change
When the practitioner changes the session format (e.g., from Video to In Person), if the currently selected date is disabled for the new format, the date auto-advances to the next compatible day.

---

## Settings & Preferences

### Bookings page settings tabs
Three tabs: **Availability** (default) → **Sessions** → **Preferences**

| Tab | Content |
|---|---|
| Availability | Booking link + weekly schedule + timezone |
| Sessions | Session type definitions (name, duration, notes required) |
| Preferences | Booking setup (enable/external/approval) + Calendar Integration + Scheduling rules (buffers, notice, hour-aligned) + Patient modifications (cancel/reschedule toggles + notice hours) |

---

## Known Issues & Decisions

### Enum mismatches
- `sessions.session_type` is an enum: `initial_consultation`, `follow_up`, `check_in`, `crisis`, `group`, `other`
- `booking_settings.session_types` JSONB uses different IDs: `initial`, `follow_up`, `check_in`
- **Solution**: `toSessionEnum()` mapper converts at insert time. `"initial"` → `"initial_consultation"`, unknown → `"other"`
- `sessions.session_format` enum: `in_person`, `virtual`, `phone`. Our UI uses `'video'` internally.
- **Solution**: always write `'virtual'` (not `'video'`) to the sessions table

### Google Calendar "Cancelled event:" language
The "Cancelled event:" prefix in Google's cancellation emails is controlled by the **recipient's Gmail language setting**, not the event language. We cannot change this. The event title and description are in the practitioner's locale.

### Manual entry limitations
- No confirmation email sent to patient
- No Google Calendar event created
- `google_event_id` is null → mismatch detection skips these
- Session created BEFORE booking (reverse order from calendar mode)

### Timezone handling
- All times stored as UTC in the database
- Slot generation uses `Intl.DateTimeFormat` for timezone offset calculation
- Display always in practitioner's timezone (from `availability_schedules.timezone`)
- Day boundary queries convert local day start/end to UTC before querying

### Alisée's missing 11am slot (April 16, 2026)
- Practitioner reported 11am not available for booking on April 30
- SQL investigation: no conflicting bookings, no overrides, schedule is 10-20
- Root cause: most likely a Google Calendar event (private/secondary calendar) blocking 11am via free/busy
- The booking was eventually created at 20:21 via Manual Entry (bypasses all availability checks)
- Confirmed by DB signatures: session created 160ms before booking + google_event_id=null = manual mode

---

## Key Files Reference

### API Routes
| File | Purpose |
|---|---|
| `src/app/api/bookings/route.ts` | Public booking creation (POST) |
| `src/app/api/bookings/[id]/route.ts` | Approve/reject/cancel (PATCH) |
| `src/app/api/bookings/[id]/reschedule/route.ts` | Practitioner reschedule |
| `src/app/api/bookings/[id]/member-action/route.ts` | Patient cancel/reschedule |
| `src/app/api/bookings/[id]/sync-calendar/route.ts` | Google Calendar sync on booking creation |
| `src/app/api/bookings/available-slots/route.ts` | Slot generation |
| `src/app/api/bookings/next-available/route.ts` | Next N days with available slots |
| `src/app/api/calendar/check-mismatches/route.ts` | Google Calendar mismatch detection |

### Components
| File | Purpose |
|---|---|
| `src/components/schedule-session-modal.tsx` | Main scheduling modal (new booking + reschedule mode) |
| `src/components/bookings/WeekCalendarView.tsx` | Week calendar on bookings page |
| `src/components/bookings/SlotCalendarView.tsx` | Click-to-book week calendar inside schedule modal |
| `src/components/ui/calendar-picker.tsx` | Date picker component |

### Services
| File | Purpose |
|---|---|
| `src/lib/services/calendar-event.ts` | `buildCalendarEvent()` + `getPractitionerName()` |
| `src/lib/services/google-calendar-sync.ts` | `syncCancelledGoogleEvents()` + `cancelBookingAndSession()` |
| `src/lib/services/google-auth.ts` | Google OAuth token management |
| `src/lib/services/google-calendar.ts` | Google Calendar busy times |
| `src/lib/notifications/email.ts` | `generateEmailHtml()` email template |
| `src/lib/email/index.ts` | `sendEmail()` via Postmark |

### Pages
| File | Purpose |
|---|---|
| `src/app/bookings/page.tsx` | Practitioner bookings page (appointments + settings) |
| `src/app/practitioner/[slug]/book/page.tsx` | Public patient booking page |
| `src/app/members/[id]/tabs/SessionsTab.tsx` | Member sessions tab |

### Mobile App
| File | Purpose |
|---|---|
| `bloomsline_mobile/app/(main)/booking.tsx` | Patient booking screen |
| `bloomsline_mobile/lib/services/booking.ts` | Booking API service (calls care app endpoints) |

### Migrations
| File | Purpose |
|---|---|
| `20251203_create_calendar_booking.sql` | Base schema: bookings, booking_settings, availability, RPC |
| `20260411_fix_slot_availability_timezone.sql` | Timezone-aware RPC |
| `20260412_patient_booking_modification.sql` | Patient cancel/reschedule columns |
| `20260413_availability_session_format.sql` | Format column on availability |
| `20260414_booking_session_format.sql` | Format column on bookings |
| `20260417_hour_aligned_slots.sql` | Hour-aligned toggle + RPC update |

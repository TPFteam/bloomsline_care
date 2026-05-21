export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google' | 'outlook';
  provider_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  calendar_id: string;
  sync_enabled: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export interface AvailabilitySchedule {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS format
  end_time: string;
  is_active: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityOverride {
  id: string;
  user_id: string;
  override_date: string; // YYYY-MM-DD
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export interface SessionType {
  id: string;
  name: string;
  name_fr?: string;
  duration: number; // minutes
  price: number | null;
  is_default?: boolean;
  notesRequired?: boolean; // Whether "Additional Notes" is mandatory for this session type
}

export interface BookingSettings {
  id: string;
  user_id: string;
  default_duration: number;
  buffer_before: number;
  buffer_after: number;
  min_notice_hours: number;
  max_advance_days: number;
  session_types: SessionType[];
  booking_page_enabled: boolean;
  booking_page_language?: 'en' | 'fr' | null;
  require_approval: boolean;
  cancellation_policy: string | null;
  booking_instructions: string | null;
  email_notifications: boolean;
  external_booking_url: string | null;
  currency?: string;
  hour_aligned_slots?: boolean;
  allow_patient_cancel?: boolean;
  allow_patient_reschedule?: boolean;
  modification_notice_hours?: number;
  // Custom title template for Google Calendar events. Supports
  // {practitioner} / {client} / {session_type}. Null = use default.
  calendar_event_title_template?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  practitioner_id: string;
  member_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  session_type: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: BookingStatus;
  payment_status: 'paid' | 'unpaid';
  notes: string | null;
  practitioner_notes: string | null;
  google_event_id: string | null;
  meet_link: string | null;
  outlook_event_id: string | null;
  cancelled_at: string | null;
  cancelled_by: 'client' | 'practitioner' | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  slot_start: string;
  slot_end: string;
  // Practitioner-side only: marks slots generated outside the practitioner's
  // configured availability_schedules. Patient-facing endpoints never set or
  // expose this flag — every slot they see falls within the schedule.
  outside_availability?: boolean;
}

export interface CreateBookingInput {
  practitioner_id: string;
  session_type: string;
  start_time: string;
  end_time: string;
  timezone: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  notes?: string;
  session_format?: string;
  member_id?: string;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface BusyInterval {
  start: string;
  end: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

import { createClient } from '@/lib/supabase/browser-client';
import type {
  CalendarConnection,
  AvailabilitySchedule,
  AvailabilityOverride,
  BookingSettings,
  Booking,
  TimeSlot,
  CreateBookingInput,
  DayOfWeek,
  SessionType,
} from '@/types/calendar';

// ============================================
// Calendar Connections
// ============================================

export async function getCalendarConnection(): Promise<CalendarConnection | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    console.error('Error fetching calendar connection:', error);
    return null;
  }

  return data;
}

export async function disconnectCalendar(): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('calendar_connections')
    .delete()
    .eq('provider', 'google');

  if (error) {
    console.error('Error disconnecting calendar:', error);
    return false;
  }

  return true;
}

// ============================================
// Availability Schedules
// ============================================

export async function getAvailabilitySchedules(userId?: string): Promise<AvailabilitySchedule[]> {
  const supabase = createClient();

  let query = supabase
    .from('availability_schedules')
    .select('*')
    .order('day_of_week');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching availability schedules:', error);
    return [];
  }

  return data || [];
}

export async function saveAvailabilitySchedule(
  schedule: Omit<AvailabilitySchedule, 'id' | 'created_at' | 'updated_at'>
): Promise<AvailabilitySchedule | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('availability_schedules')
    .upsert(schedule, {
      onConflict: 'user_id,day_of_week,start_time,end_time',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving availability schedule:', error);
    return null;
  }

  return data;
}

export async function deleteAvailabilitySchedule(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('availability_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting availability schedule:', error);
    return false;
  }

  return true;
}

export async function bulkUpdateAvailability(
  userId: string,
  schedules: Array<{
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    is_active: boolean;
    timezone: string;
  }>
): Promise<boolean> {
  const supabase = createClient();

  // Ensure valid session before modifying
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.refreshSession()
  }

  // Delete all existing schedules for this user, then insert fresh
  const { error: deleteError, count } = await supabase
    .from('availability_schedules')
    .delete()
    .eq('user_id', userId);

  console.log('[availability] Delete result:', { error: deleteError?.message, count });

  if (deleteError) {
    console.error('Error deleting existing availability:', deleteError);
    // If delete failed, try upsert as fallback
    if (schedules.length > 0) {
      const { error } = await supabase
        .from('availability_schedules')
        .upsert(
          schedules.map((s) => ({
            ...s,
            user_id: userId,
          })),
          { onConflict: 'user_id,day_of_week,start_time,end_time' }
        );
      if (error) {
        console.error('Error upserting availability:', error);
        return false;
      }
    }
    return true;
  }

  // Insert new schedules
  if (schedules.length > 0) {
    // Deduplicate slots (same day + start + end = keep last one)
    const uniqueMap = new Map<string, typeof schedules[0]>();
    for (const s of schedules) {
      const key = `${s.day_of_week}|${s.start_time}|${s.end_time}`;
      uniqueMap.set(key, s);
    }
    const dedupedSchedules = Array.from(uniqueMap.values());

    const insertData = dedupedSchedules.map((s) => ({
      user_id: userId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
      timezone: s.timezone,
    }))

    console.log('[availability] Inserting', insertData.length, 'slots:', insertData.map(s => `${s.day_of_week} ${s.start_time}-${s.end_time}`))
    const { error } = await supabase
      .from('availability_schedules')
      .insert(insertData);

    if (error) {
      console.error('[availability] Error inserting:', error);
      return false;
    }
    console.log('[availability] Insert success');
  }

  return true;
}

// ============================================
// Availability Overrides
// ============================================

export async function getAvailabilityOverrides(
  userId?: string,
  fromDate?: string,
  toDate?: string
): Promise<AvailabilityOverride[]> {
  const supabase = createClient();

  let query = supabase
    .from('availability_overrides')
    .select('*')
    .order('override_date');

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (fromDate) {
    query = query.gte('override_date', fromDate);
  }
  if (toDate) {
    query = query.lte('override_date', toDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching availability overrides:', error);
    return [];
  }

  return data || [];
}

export async function createAvailabilityOverride(
  override: Omit<AvailabilityOverride, 'id' | 'created_at'>
): Promise<AvailabilityOverride | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('availability_overrides')
    .insert(override)
    .select()
    .single();

  if (error) {
    console.error('Error creating availability override:', error);
    return null;
  }

  return data;
}

export async function deleteAvailabilityOverride(id: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('availability_overrides')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting availability override:', error);
    return false;
  }

  return true;
}

// ============================================
// Booking Settings
// ============================================

export async function getBookingSettings(userId?: string): Promise<BookingSettings | null> {
  const supabase = createClient();

  let query = supabase
    .from('booking_settings')
    .select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[getBookingSettings] No settings found for user:', userId || '(no filter)');
      return null;
    }
    console.error('[getBookingSettings] Error:', error);
    return null;
  }

  return data;
}

export async function saveBookingSettings(
  settings: Partial<BookingSettings> & { user_id: string }
): Promise<BookingSettings | null> {
  const supabase = createClient();

  // Strip read-only fields that shouldn't be sent on insert/update
  const { id: _id, created_at: _ca, updated_at: _ua, ...settingsToSave } = settings as BookingSettings;

  // Try update first (existing row)
  const { data: existing } = await supabase
    .from('booking_settings')
    .select('id')
    .eq('user_id', settings.user_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('booking_settings')
      .update(settingsToSave)
      .eq('user_id', settings.user_id)
      .select()
      .single();

    if (error) {
      console.error('[saveBookingSettings] Update error:', error.code, error.message, error.details);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('booking_settings')
      .insert(settingsToSave)
      .select()
      .single();

    if (error) {
      console.error('[saveBookingSettings] Insert error:', error.code, error.message, error.details);
      return null;
    }
    return data;
  }
}

// ============================================
// Bookings
// ============================================

export async function getBookings(filters?: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<Booking[]> {
  const supabase = createClient();

  let query = supabase
    .from('bookings')
    .select('*')
    .order('start_time', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.from) {
    query = query.gte('start_time', filters.from);
  }
  if (filters?.to) {
    query = query.lte('start_time', filters.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return data || [];
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    return null;
  }

  return data;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...input,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return null;
  }

  return data;
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    return null;
  }

  return data;
}

export async function cancelBooking(
  id: string,
  cancelledBy: 'client' | 'practitioner',
  reason?: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
    })
    .eq('id', id);

  if (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }

  return true;
}

// ============================================
// Available Slots (Public)
// ============================================

export async function getAvailableSlots(
  practitionerId: string,
  date: string,
  duration?: number
): Promise<TimeSlot[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_available_slots', {
      p_practitioner_id: practitionerId,
      p_date: date,
      p_duration: duration || 60,
    });

  if (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Public Practitioner Data (for booking page)
// ============================================

export async function getPractitionerBookingInfo(slug: string): Promise<{
  profile: {
    id: string;
    user_id: string;
    slug: string;
    headline: string | null;
    bio: string | null;
    specialties: string[];
    offers_telehealth: boolean;
    offers_in_person: boolean;
  } | null;
  settings: BookingSettings | null;
  user: {
    full_name: string;
    avatar_url: string | null;
  } | null;
} | null> {
  const supabase = createClient();

  // Get practitioner profile
  const { data: profile, error: profileError } = await supabase
    .from('practitioner_profiles')
    .select('id, user_id, slug, headline, bio, specialties, offers_telehealth, offers_in_person')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Get booking settings
  const { data: settings } = await supabase
    .from('booking_settings')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('booking_page_enabled', true)
    .limit(1)
    .single();

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', profile.user_id)
    .single();

  return {
    profile,
    settings,
    user,
  };
}

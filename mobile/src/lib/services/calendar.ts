import * as Calendar from 'expo-calendar';

// ---------------------------------------------------------------------------
// Normalized event type
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  calendarId: string;
  calendarName: string;
  calendarColor?: string;
  isAllDay?: boolean;
}

// ---------------------------------------------------------------------------
// Grouped events type (non-overlapping windows)
// ---------------------------------------------------------------------------

export interface GroupedCalendarEvents {
  today: CalendarEvent[];
  thisWeek: CalendarEvent[];
  thisMonth: CalendarEvent[];
}

// ---------------------------------------------------------------------------
// Create event params
// ---------------------------------------------------------------------------

export interface CreateEventParams {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  needsConfirmation?: boolean;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 500;

let _lastFetchTimestamp = 0;

function shouldDebounce(): boolean {
  const now = Date.now();
  if (now - _lastFetchTimestamp < DEBOUNCE_MS) {
    return true;
  }
  _lastFetchTimestamp = now;
  return false;
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

export async function requestCalendarPermission(): Promise<{ granted: boolean }> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return { granted: status === 'granted' };
}

// ---------------------------------------------------------------------------
// Fetch + normalize
// ---------------------------------------------------------------------------

export async function fetchEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarEvent[]> {
  // Get all calendars
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (calendars.length === 0) {
    return [];
  }

  const calendarIds = calendars.map((c) => c.id);

  // Build a lookup for calendar metadata
  const calendarMap: Record<string, { name: string; color?: string }> = {};
  for (const cal of calendars) {
    calendarMap[cal.id] = {
      name: cal.title ?? 'Unknown',
      color: cal.color ?? undefined,
    };
  }

  // Fetch raw events
  const rawEvents = await Calendar.getEventsAsync(calendarIds, rangeStart, rangeEnd);

  // Normalize
  const normalized: CalendarEvent[] = rawEvents.map((e) => {
    const calMeta = calendarMap[e.calendarId] ?? { name: 'Unknown' };
    return {
      id: e.id,
      title: e.title ?? '(No Title)',
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      location: e.location ?? undefined,
      notes: e.notes ?? undefined,
      calendarId: e.calendarId,
      calendarName: calMeta.name,
      calendarColor: calMeta.color,
      isAllDay: e.allDay ?? false,
    };
  });

  // Sort by startDate ascending
  normalized.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return normalized;
}

// ---------------------------------------------------------------------------
// Fetch for a specific day
// ---------------------------------------------------------------------------

export async function fetchEventsForDay(date: Date): Promise<CalendarEvent[]> {
  return fetchEvents(startOfDay(date), endOfDay(date));
}

// ---------------------------------------------------------------------------
// Fetch for a whole week (starting from weekStart)
// ---------------------------------------------------------------------------

export async function fetchEventsForWeek(weekStart: Date): Promise<CalendarEvent[]> {
  const ws = startOfDay(weekStart);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  we.setHours(23, 59, 59, 999);
  return fetchEvents(ws, we);
}

// ---------------------------------------------------------------------------
// Fetch events for a whole month
// ---------------------------------------------------------------------------

export async function fetchEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
  // month is 0-indexed (same as JS Date)
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return fetchEvents(monthStart, monthEnd);
}

// ---------------------------------------------------------------------------
// Create a calendar event
// Returns { success, eventId?, error? } — never throws.
// ---------------------------------------------------------------------------

export async function createCalendarEvent(
  params: CreateEventParams,
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'permission_denied' };
    }

    let defaultCalendar: Calendar.Calendar | null = null;
    try {
      defaultCalendar = await Calendar.getDefaultCalendarAsync();
    } catch {
      // getDefaultCalendarAsync may not exist on all platforms — fall back below
    }

    let calendarId: string | undefined = defaultCalendar?.id;

    if (!calendarId) {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications);
      calendarId = writable?.id;
    }

    if (!calendarId) {
      return { success: false, error: 'No writable calendar found' };
    }

    const eventDetails: Partial<Calendar.Event> = {
      title: params.title,
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.location ? { location: params.location } : {}),
      ...(params.notes ? { notes: params.notes } : {}),
    };

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    return { success: true, eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Fetch grouped (non-overlapping buckets)
//   today      = today only
//   thisWeek   = tomorrow..end of this week
//   thisMonth  = start of next week..end of month
// ---------------------------------------------------------------------------

export async function fetchGroupedEvents(debounce: boolean = false): Promise<GroupedCalendarEvents | null> {
  if (debounce && shouldDebounce()) {
    return null;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // tomorrow start
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekEnd = endOfWeek(now);

  // next week start
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  nextWeekStart.setHours(0, 0, 0, 0);

  const monthEnd = endOfMonth(now);

  // Fetch a single wide range and split into buckets
  const allEvents = await fetchEvents(todayStart, monthEnd);

  const today = allEvents.filter(
    (e) => e.startDate >= todayStart && e.startDate <= todayEnd,
  );

  const thisWeek = allEvents.filter(
    (e) => e.startDate >= tomorrowStart && e.startDate <= weekEnd,
  );

  const thisMonth = allEvents.filter(
    (e) => e.startDate >= nextWeekStart && e.startDate <= monthEnd,
  );

  return { today, thisWeek, thisMonth };
}

// ---------------------------------------------------------------------------
// Format time
// ---------------------------------------------------------------------------

export function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) {
    return 'All Day';
  }
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const start = event.startDate.toLocaleTimeString('en-US', opts);
  const end = event.endDate.toLocaleTimeString('en-US', opts);
  return `${start} \u2013 ${end}`;
}

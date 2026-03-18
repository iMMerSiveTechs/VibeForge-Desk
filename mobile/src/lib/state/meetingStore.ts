import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '@/lib/services/calendar';

// ---------------------------------------------------------------------------
// Tiny uid helper — no external deps
// ---------------------------------------------------------------------------

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinkedMeeting {
  id: string;                  // Desk-local stable ID
  linkedEventId: string;       // expo-calendar event ID (de-dupe key)
  calendarId: string;
  // Cached event fields — updated on refresh, never overwrite localNotes
  cachedTitle: string;
  cachedStartDate: string;     // ISO string
  cachedEndDate: string;       // ISO string
  cachedLocation?: string;
  cachedAllDay: boolean;
  cachedCalendarName: string;
  cachedCalendarColor?: string;
  // Desk-local metadata — never overwritten by calendar refresh
  localNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingStore {
  meetings: Record<string, LinkedMeeting>; // keyed by linkedEventId for O(1) lookups
  findOrCreate: (event: CalendarEvent) => LinkedMeeting;
  updateCachedFields: (linkedEventId: string, event: CalendarEvent) => void;
  updateLocalNotes: (linkedEventId: string, notes: string) => void;
  getMeeting: (linkedEventId: string) => LinkedMeeting | undefined;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetings: {},

      findOrCreate: (event: CalendarEvent): LinkedMeeting => {
        const existing = get().meetings[event.id];
        if (existing) {
          // Update cached fields without touching localNotes
          get().updateCachedFields(event.id, event);
          return get().meetings[event.id];
        }
        // Create new
        const now = new Date().toISOString();
        const newMeeting: LinkedMeeting = {
          id: uid(),
          linkedEventId: event.id,
          calendarId: event.calendarId,
          cachedTitle: event.title,
          cachedStartDate: event.startDate.toISOString(),
          cachedEndDate: event.endDate.toISOString(),
          cachedLocation: event.location,
          cachedAllDay: event.isAllDay ?? false,
          cachedCalendarName: event.calendarName,
          cachedCalendarColor: event.calendarColor,
          localNotes: '',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          meetings: {
            ...state.meetings,
            [event.id]: newMeeting,
          },
        }));
        return newMeeting;
      },

      updateCachedFields: (linkedEventId: string, event: CalendarEvent): void => {
        set((state) => {
          const existing = state.meetings[linkedEventId];
          if (!existing) return state;
          return {
            meetings: {
              ...state.meetings,
              [linkedEventId]: {
                ...existing,
                calendarId: event.calendarId,
                cachedTitle: event.title,
                cachedStartDate: event.startDate.toISOString(),
                cachedEndDate: event.endDate.toISOString(),
                cachedLocation: event.location,
                cachedAllDay: event.isAllDay ?? false,
                cachedCalendarName: event.calendarName,
                cachedCalendarColor: event.calendarColor,
                updatedAt: new Date().toISOString(),
                // localNotes and createdAt and id are intentionally not touched
              },
            },
          };
        });
      },

      updateLocalNotes: (linkedEventId: string, notes: string): void => {
        set((state) => {
          const existing = state.meetings[linkedEventId];
          if (!existing) return state;
          return {
            meetings: {
              ...state.meetings,
              [linkedEventId]: {
                ...existing,
                localNotes: notes,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      getMeeting: (linkedEventId: string): LinkedMeeting | undefined => {
        return get().meetings[linkedEventId];
      },
    }),
    {
      name: 'vf-meetings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useMeetingStore;

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  AppState,
  AppStateStatus,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarDays,
  RotateCcw,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  X,
  Check,
  Edit2,
  Lightbulb,
  Lock,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import StageSafeHeader from '@/components/StageSafeHeader';
import {
  requestCalendarPermission,
  fetchEventsForDay,
  fetchEventsForMonth,
  createCalendarEvent,
  formatEventTime,
  type CalendarEvent,
} from '@/lib/services/calendar';
import {
  parseSuggestions,
  loadDismissedSet,
  dismissSuggestion,
  type ParsedSuggestion,
} from '@/lib/services/suggestions';
import useMeetingStore from '@/lib/state/meetingStore';
import useDeskStore from '@/lib/state/store';
import { useSubscription } from '@/lib/subscription/SubscriptionContext';
import { canUseCalendarFeature } from '@/lib/subscription/gating';
import ProLockModal from '@/components/ProLockModal';

// ---------------------------------------------------------------------------
// Day-of-week labels
// ---------------------------------------------------------------------------
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatSuggestionDateTime(s: ParsedSuggestion): string {
  if (!s.date && !s.time) return 'No date/time';
  const parts: string[] = [];
  if (s.date) {
    parts.push(`${DAYS_SHORT[s.date.getDay()]} ${MONTHS_SHORT[s.date.getMonth()]} ${s.date.getDate()}`);
  }
  if (s.time) {
    const { hour, minute } = s.time;
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'pm' : 'am';
    parts.push(`${h}:${m}${ampm}`);
  }
  if (s.needsConfirmation) parts.push('(confirm date)');
  return parts.join(' · ');
}

function buildEventDate(s: EditState): { startDate: Date; endDate: Date } | null {
  if (!s.dateStr) return null;
  const [y, m, d] = s.dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [h, min] = s.timeStr ? s.timeStr.split(':').map(Number) : [9, 0];
  const start = new Date(y, m - 1, d, h || 9, min || 0, 0);
  const dur = parseInt(s.durationStr, 10) || 60;
  const end = new Date(start.getTime() + dur * 60 * 1000);
  return { startDate: start, endDate: end };
}

// ---------------------------------------------------------------------------
// Types for edit modal state
// ---------------------------------------------------------------------------

interface EditState {
  suggestionId: string;
  title: string;
  dateStr: string;     // YYYY-MM-DD
  timeStr: string;     // HH:MM
  durationStr: string; // minutes as string
  locationStr: string;
}

// ---------------------------------------------------------------------------
// EventRow
// ---------------------------------------------------------------------------

function EventRow({
  event, theme, isLinked, onPress,
}: {
  event: CalendarEvent;
  theme: ReturnType<typeof useTheme>;
  isLinked: boolean;
  onPress: () => void;
}) {
  const dotColor = event.calendarColor ?? theme.spineAccent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.deskHl + 'CC' : theme.deskHl,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.border,
        flexDirection: 'row',
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 3, backgroundColor: dotColor, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} />
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.muted }}>{formatEventTime(event)}</Text>
          <Text style={{ fontSize: 10, color: theme.muted, opacity: 0.6 }}>· {event.calendarName}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textOnDesk, marginBottom: event.location ? 4 : 0 }} numberOfLines={2}>
          {event.title}
        </Text>
        {event.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={11} color={theme.muted} />
            <Text style={{ fontSize: 11, color: theme.muted, flex: 1 }} numberOfLines={1}>{event.location}</Text>
          </View>
        ) : null}
      </View>
      {isLinked ? (
        <View style={{ justifyContent: 'center', alignItems: 'center', paddingRight: 14, paddingLeft: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.spineAccent + '1A', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 0.5, borderColor: theme.spineAccent + '44' }}>
            <FileText size={10} color={theme.spineAccent} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.spineAccent }}>Notes</Text>
          </View>
        </View>
      ) : <View style={{ width: 14 }} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// PermissionDeniedState
// ---------------------------------------------------------------------------

function PermissionDeniedState({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 }}>
      <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: theme.deskHl, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <CalendarDays size={36} color={theme.muted} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textOnDesk, textAlign: 'center' }}>Calendar access required</Text>
      <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 20 }}>
        Enable in Settings › Privacy › Calendars
      </Text>
      <Pressable onPress={() => Linking.openSettings()} style={{ backgroundColor: theme.spineAccent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MonthGrid
// ---------------------------------------------------------------------------

function MonthGrid({
  year, month, today, selectedDate, eventDotMap, onSelectDay, onPrevMonth, onNextMonth, theme,
}: {
  year: number;
  month: number;
  today: Date;
  selectedDate: Date | null;
  eventDotMap: Record<string, string[]>; // dateKey → colors
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDow = firstDayOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build grid cells: leading nulls + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      {/* Month nav */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
        <Pressable onPress={onPrevMonth} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft size={20} color={theme.textOnDesk} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: theme.textOnDesk }}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={onNextMonth} hitSlop={10} style={{ padding: 8 }}>
          <ChevronRight size={20} color={theme.textOnDesk} />
        </Pressable>
      </View>

      {/* Day-of-week header */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DOW.map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: theme.muted, letterSpacing: 0.5 }}>
            {d}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 2 }}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) {
              return <View key={colIdx} style={{ flex: 1, aspectRatio: 1 }} />;
            }
            const cellDate = new Date(year, month, day);
            const isToday = isSameDay(cellDate, today);
            const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
            const dots = eventDotMap[dateKey(cellDate)] ?? [];
            const hasEvents = dots.length > 0;

            return (
              <Pressable
                key={colIdx}
                onPress={() => onSelectDay(cellDate)}
                style={{ flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isToday ? theme.spineAccent : isSelected ? theme.spineAccent + '22' : 'transparent',
                  borderWidth: isSelected && !isToday ? 1.5 : 0,
                  borderColor: theme.spineAccent,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: isToday || isSelected ? '700' : '400',
                    color: isToday ? '#fff' : theme.textOnDesk,
                  }}>
                    {day}
                  </Text>
                </View>
                {hasEvents ? (
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 2, height: 5, justifyContent: 'center' }}>
                    {dots.slice(0, 3).map((color, i) => (
                      <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color || theme.spineAccent }} />
                    ))}
                  </View>
                ) : <View style={{ height: 7 }} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SuggestionCard
// ---------------------------------------------------------------------------

function SuggestionCard({
  s, theme, onEdit, onDismiss, onAdd,
}: {
  s: ParsedSuggestion;
  theme: ReturnType<typeof useTheme>;
  onEdit: () => void;
  onDismiss: () => void;
  onAdd: () => void;
}) {
  const kindColors: Record<string, string> = {
    sticky: '#F4C542',
    note: theme.spineAccent,
    plan: '#34C759',
    task: '#FF9500',
    journal: '#AF52DE',
    goal: '#FF3B30',
  };
  const kindColor = kindColors[s.sourceKind] ?? theme.spineAccent;

  return (
    <View style={{
      backgroundColor: theme.deskHl,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 0.5,
      borderColor: theme.border,
      overflow: 'hidden',
    }}>
      {/* Left accent */}
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: kindColor }} />

      <View style={{ paddingLeft: 16, paddingRight: 14, paddingVertical: 12 }}>
        {/* Title */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textOnDesk, marginBottom: 3 }} numberOfLines={2}>
          {s.title}
        </Text>

        {/* Date/time */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: s.needsConfirmation ? '#FF9500' : theme.spineAccent, marginBottom: 6 }}>
          {formatSuggestionDateTime(s)}
        </Text>

        {/* Evidence snippet */}
        <Text style={{ fontSize: 11, color: theme.muted, fontStyle: 'italic', marginBottom: 8 }} numberOfLines={2}>
          "{s.evidenceSnippet}"
        </Text>

        {/* Source badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <View style={{ backgroundColor: kindColor + '22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 0.5, borderColor: kindColor + '44' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: kindColor, letterSpacing: 0.3, textTransform: 'capitalize' }}>
              {s.sourceKind}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: theme.muted, flex: 1 }} numberOfLines={1}>
            {s.sourceTitle}
          </Text>
          {s.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MapPin size={10} color={theme.muted} />
              <Text style={{ fontSize: 10, color: theme.muted }} numberOfLines={1}>{s.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onEdit}
            style={{ flex: 1, backgroundColor: theme.desk, borderRadius: 9, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5, borderWidth: 0.5, borderColor: theme.border }}
          >
            <Edit2 size={13} color={theme.textOnDesk} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textOnDesk }}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            style={{ flex: 1, backgroundColor: theme.desk, borderRadius: 9, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5, borderWidth: 0.5, borderColor: theme.border }}
          >
            <X size={13} color={theme.muted} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.muted }}>Dismiss</Text>
          </Pressable>
          <Pressable
            onPress={onAdd}
            style={{ flex: 1, backgroundColor: theme.spineAccent, borderRadius: 9, paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}
          >
            <Plus size={13} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// EditModal
// ---------------------------------------------------------------------------

function EditModal({
  visible, state, onSave, onCancel, theme,
}: {
  visible: boolean;
  state: EditState | null;
  onSave: (s: EditState) => void;
  onCancel: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [local, setLocal] = useState<EditState | null>(null);

  useEffect(() => {
    if (state) setLocal({ ...state });
  }, [state]);

  if (!local) return null;

  const field = (label: string, key: keyof EditState, placeholder: string) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>{label}</Text>
      <TextInput
        value={local[key] as string}
        onChangeText={(v) => setLocal((p) => p ? { ...p, [key]: v } : p)}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        style={{ backgroundColor: theme.deskHl, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, color: theme.textOnDesk, fontSize: 15, borderWidth: 0.5, borderColor: theme.border }}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: theme.desk, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: theme.textOnDesk }}>Edit Suggestion</Text>
            <Pressable onPress={onCancel} hitSlop={10}><X size={20} color={theme.muted} /></Pressable>
          </View>

          {field('Title', 'title', 'Event title')}
          {field('Date', 'dateStr', 'YYYY-MM-DD')}
          {field('Time', 'timeStr', 'HH:MM  (e.g. 14:30)')}
          {field('Duration (min)', 'durationStr', '60')}
          {field('Location', 'locationStr', 'Optional location')}

          <Pressable
            onPress={() => onSave(local)}
            style={{ backgroundColor: theme.spineAccent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CalendarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isPro } = useSubscription();
  const [lockModal, setLockModal] = useState<{ visible: boolean; featureName: string }>({ visible: false, featureName: '' });

  const meetings = useMeetingStore((s) => s.meetings);
  const findOrCreate = useMeetingStore((s) => s.findOrCreate);
  const itemsById = useDeskStore((s) => s.itemsById);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Calendar state
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<ParsedSuggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  // Local suggestion edits (user can change title/date/time before adding)
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<ParsedSuggestion>>>({});

  // Banner
  const [banner, setBanner] = useState<{ message: string; isError: boolean } | null>(null);

  // AppState ref
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastFetchRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Suggestions — derived from store
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const items = Object.values(itemsById);
    const parsed = parseSuggestions(items);
    setSuggestions(parsed);
    if (parsed.length > 0) setSuggestionsOpen(true);
  }, [itemsById]);

  useEffect(() => {
    loadDismissedSet().then(setDismissedIds);
  }, []);

  const visibleSuggestions = useMemo(() => {
    return suggestions
      .filter((s) => !dismissedIds.has(s.id))
      .map((s) => ({ ...s, ...(localEdits[s.id] ?? {}) }));
  }, [suggestions, dismissedIds, localEdits]);

  // ---------------------------------------------------------------------------
  // Event dot map for month grid
  // ---------------------------------------------------------------------------

  const eventDotMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const e of monthEvents) {
      const key = dateKey(e.startDate);
      if (!map[key]) map[key] = [];
      map[key].push(e.calendarColor ?? theme.spineAccent);
    }
    return map;
  }, [monthEvents, theme.spineAccent]);

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------

  const doRequestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestCalendarPermission();
    setPermissionGranted(result.granted);
    return result.granted;
  }, []);

  const fetchMonthData = useCallback(async (y: number, m: number) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 300) return;
    lastFetchRef.current = now;

    setLoading(true);
    try {
      const events = await fetchEventsForMonth(y, m);
      setMonthEvents(events);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDay = useCallback(async (date: Date) => {
    setDayLoading(true);
    try {
      const events = await fetchEventsForDay(date);
      setDayEvents(events);
    } catch {
      setDayEvents([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Initialise
  // ---------------------------------------------------------------------------

  const initialise = useCallback(async () => {
    const granted = await doRequestPermission();
    if (!granted) return;
    await fetchMonthData(viewYear, viewMonth);
    await fetchDay(selectedDate);
  }, [doRequestPermission, fetchMonthData, viewYear, viewMonth, selectedDate, fetchDay]);

  useEffect(() => { initialise(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => { if (permissionGranted) { fetchMonthData(viewYear, viewMonth); fetchDay(selectedDate); } }, [permissionGranted, viewYear, viewMonth, selectedDate, fetchMonthData, fetchDay]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current !== 'active' && next === 'active' && permissionGranted) {
        fetchMonthData(viewYear, viewMonth);
        fetchDay(selectedDate);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [permissionGranted, viewYear, viewMonth, selectedDate, fetchMonthData, fetchDay]);

  // ---------------------------------------------------------------------------
  // Month navigation
  // ---------------------------------------------------------------------------

  const goPrevMonth = useCallback(() => {
    setViewYear((y) => viewMonth === 0 ? y - 1 : y);
    setViewMonth((m) => m === 0 ? 11 : m - 1);
  }, [viewMonth]);

  const goNextMonth = useCallback(() => {
    setViewYear((y) => viewMonth === 11 ? y + 1 : y);
    setViewMonth((m) => m === 11 ? 0 : m + 1);
  }, [viewMonth]);

  useEffect(() => {
    if (permissionGranted) fetchMonthData(viewYear, viewMonth);
  }, [viewYear, viewMonth, permissionGranted, fetchMonthData]);

  // ---------------------------------------------------------------------------
  // Day selection
  // ---------------------------------------------------------------------------

  const handleSelectDay = useCallback((d: Date) => {
    setSelectedDate(d);
    fetchDay(d);
  }, [fetchDay]);

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(async () => {
    const granted = permissionGranted ?? await doRequestPermission();
    if (!granted) return;
    await Promise.all([fetchMonthData(viewYear, viewMonth), fetchDay(selectedDate)]);
  }, [permissionGranted, doRequestPermission, fetchMonthData, viewYear, viewMonth, fetchDay, selectedDate]);

  // ---------------------------------------------------------------------------
  // Banner helper
  // ---------------------------------------------------------------------------

  const showBanner = useCallback((message: string, isError: boolean) => {
    setBanner({ message, isError });
    setTimeout(() => setBanner(null), 3500);
  }, []);

  // ---------------------------------------------------------------------------
  // Add event flow
  // ---------------------------------------------------------------------------

  const addSuggestion = useCallback(async (s: ParsedSuggestion) => {
    // Request write permission
    const { status } = await (await import('expo-calendar')).requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      showBanner('Calendar write access denied. Tap to open Settings.', true);
      return;
    }

    const startDate = s.date ? new Date(s.date) : new Date();
    if (s.time) { startDate.setHours(s.time.hour, s.time.minute, 0, 0); }
    else { startDate.setHours(9, 0, 0, 0); }
    const endDate = new Date(startDate.getTime() + s.duration * 60 * 1000);

    const result = await createCalendarEvent({
      title: s.title,
      startDate,
      endDate,
      location: s.location ?? undefined,
    });

    if (result.success) {
      showBanner(`"${s.title}" added to Apple Calendar`, false);
      // Auto-dismiss the suggestion
      const newSet = new Set(dismissedIds);
      newSet.add(s.id);
      setDismissedIds(newSet);
      await dismissSuggestion(s.id);
      // Refresh calendar view
      await Promise.all([fetchMonthData(viewYear, viewMonth), fetchDay(selectedDate)]);
    } else {
      if (result.error === 'permission_denied') {
        showBanner('Calendar write access denied. Open Settings to allow.', true);
      } else {
        showBanner(`Failed to add event: ${result.error ?? 'Unknown error'}`, true);
      }
    }
  }, [dismissedIds, fetchMonthData, fetchDay, viewYear, viewMonth, selectedDate, showBanner]);

  const addAllSuggestions = useCallback(async () => {
    if (visibleSuggestions.length === 0) return;
    const { status } = await (await import('expo-calendar')).requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      showBanner('Calendar write access denied. Open Settings to allow.', true);
      return;
    }
    let added = 0;
    const newDismissed = new Set(dismissedIds);
    for (const s of visibleSuggestions) {
      const startDate = s.date ? new Date(s.date) : new Date();
      if (s.time) { startDate.setHours(s.time.hour, s.time.minute, 0, 0); }
      else { startDate.setHours(9, 0, 0, 0); }
      const endDate = new Date(startDate.getTime() + s.duration * 60 * 1000);
      const result = await createCalendarEvent({ title: s.title, startDate, endDate, location: s.location ?? undefined });
      if (result.success) {
        added++;
        newDismissed.add(s.id);
        await dismissSuggestion(s.id);
      }
    }
    setDismissedIds(newDismissed);
    showBanner(`${added} event${added !== 1 ? 's' : ''} added to Apple Calendar`, false);
    await Promise.all([fetchMonthData(viewYear, viewMonth), fetchDay(selectedDate)]);
  }, [visibleSuggestions, dismissedIds, showBanner, fetchMonthData, fetchDay, viewYear, viewMonth, selectedDate]);

  // ---------------------------------------------------------------------------
  // Dismiss
  // ---------------------------------------------------------------------------

  const handleDismiss = useCallback(async (id: string) => {
    const newSet = new Set(dismissedIds);
    newSet.add(id);
    setDismissedIds(newSet);
    await dismissSuggestion(id);
  }, [dismissedIds]);

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------

  const openEdit = useCallback((s: ParsedSuggestion) => {
    const d = s.date;
    const dateStr = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
    const timeStr = s.time ? `${String(s.time.hour).padStart(2,'0')}:${String(s.time.minute).padStart(2,'0')}` : '';
    setEditState({
      suggestionId: s.id,
      title: s.title,
      dateStr,
      timeStr,
      durationStr: String(s.duration),
      locationStr: s.location ?? '',
    });
    setEditVisible(true);
  }, []);

  const handleEditSave = useCallback((es: EditState) => {
    // Parse back into suggestion fields
    let date: Date | null = null;
    if (es.dateStr) {
      const [y, m, d] = es.dateStr.split('-').map(Number);
      if (y && m && d) date = new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    let time: { hour: number; minute: number } | null = null;
    if (es.timeStr) {
      const [h, min] = es.timeStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(min)) time = { hour: h, minute: min };
    }
    setLocalEdits((prev) => ({
      ...prev,
      [es.suggestionId]: {
        title: es.title,
        date,
        time,
        duration: parseInt(es.durationStr, 10) || 60,
        location: es.locationStr || null,
        needsConfirmation: false,
      },
    }));
    setEditVisible(false);
    setEditState(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh button
  // ---------------------------------------------------------------------------

  const refreshButton = (
    <Pressable
      onPress={handleRefresh}
      hitSlop={10}
      style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.deskHl, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}
    >
      {loading ? <ActivityIndicator size="small" color={theme.spineAccent} /> : <RotateCcw size={16} color={theme.textOnDesk} />}
    </Pressable>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader title="Calendar" onBack={() => router.back()} rightActions={refreshButton} />

      {/* Banner */}
      {banner ? (
        <Pressable
          onPress={() => { if (banner.isError) Linking.openSettings(); setBanner(null); }}
          style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: banner.isError ? '#FF3B30' : '#34C759', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          {banner.isError ? <X size={16} color="#fff" /> : <Check size={16} color="#fff" />}
          <Text style={{ flex: 1, color: '#fff', fontWeight: '600', fontSize: 13 }}>{banner.message}</Text>
        </Pressable>
      ) : null}

      {/* Loading first time */}
      {loading && permissionGranted === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.spineAccent} />
          <Text style={{ fontSize: 14, color: theme.muted, marginTop: 12 }}>Loading calendar…</Text>
        </View>
      ) : permissionGranted === false ? (
        <PermissionDeniedState theme={theme} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Month Grid */}
          <View style={{ marginTop: 12, backgroundColor: theme.deskHl, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: theme.border }}>
            <MonthGrid
              year={viewYear}
              month={viewMonth}
              today={today}
              selectedDate={selectedDate}
              eventDotMap={eventDotMap}
              onSelectDay={handleSelectDay}
              onPrevMonth={goPrevMonth}
              onNextMonth={goNextMonth}
              theme={theme}
            />
          </View>

          {/* Day Events Panel */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: theme.muted, textTransform: 'uppercase' }}>
                {isSameDay(selectedDate, today) ? 'Today' : `${DAYS_SHORT[selectedDate.getDay()]} ${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
              </Text>
              {dayLoading ? <ActivityIndicator size="small" color={theme.spineAccent} /> : null}
            </View>

            {dayLoading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={theme.spineAccent} />
              </View>
            ) : dayEvents.length === 0 ? (
              <View style={{ paddingVertical: 18, paddingHorizontal: 16, backgroundColor: theme.deskHl, borderRadius: 12, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center' }}>
                <CalendarDays size={22} color={theme.muted} />
                <Text style={{ fontSize: 13, color: theme.muted, marginTop: 8 }}>No events</Text>
              </View>
            ) : (
              dayEvents.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  theme={theme}
                  isLinked={!!meetings[e.id]}
                  onPress={() => { findOrCreate(e); router.push({ pathname: '/meeting-detail', params: { eventId: e.id } }); }}
                />
              ))
            )}
          </View>

          {/* Suggestions Panel */}
          <View style={{ marginTop: 24 }}>
            <Pressable
              onPress={() => setSuggestionsOpen((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
            >
              <Lightbulb size={15} color={theme.spineAccent} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: theme.muted, textTransform: 'uppercase', marginLeft: 6 }}>
                Suggestions from Desk
              </Text>
              {visibleSuggestions.length > 0 ? (
                <View style={{ backgroundColor: theme.spineAccent + '22', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: theme.spineAccent + '44' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.spineAccent }}>{visibleSuggestions.length}</Text>
                </View>
              ) : null}
              <ChevronRight size={16} color={theme.muted} style={{ marginLeft: 8, transform: [{ rotate: suggestionsOpen ? '90deg' : '0deg' }] }} />
            </Pressable>

            {suggestionsOpen ? (
              <>
                {visibleSuggestions.length === 0 ? (
                  <View style={{ paddingVertical: 18, paddingHorizontal: 16, backgroundColor: theme.deskHl, borderRadius: 12, borderWidth: 0.5, borderColor: theme.border, alignItems: 'center' }}>
                    <Sparkles size={20} color={theme.muted} />
                    <Text style={{ fontSize: 13, color: theme.muted, marginTop: 8, textAlign: 'center' }}>
                      Add notes or stickies with dates and times{'\n'}to see suggestions here
                    </Text>
                  </View>
                ) : (
                  <>
                    {visibleSuggestions.length >= 2 ? (
                      <Pressable
                        onPress={() => {
                          if (!canUseCalendarFeature('bulk_add', isPro)) {
                            setLockModal({ visible: true, featureName: 'Add All suggestions' });
                            return;
                          }
                          addAllSuggestions();
                        }}
                        style={{ backgroundColor: theme.spineAccent + '18', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 0.5, borderColor: theme.spineAccent + '44', marginBottom: 12 }}
                      >
                        {!canUseCalendarFeature('bulk_add', isPro) ? (
                          <Lock size={14} color={theme.spineAccent} />
                        ) : (
                          <Plus size={15} color={theme.spineAccent} />
                        )}
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.spineAccent }}>Add All ({visibleSuggestions.length})</Text>
                      </Pressable>
                    ) : null}
                    {visibleSuggestions.map((s) => (
                      <SuggestionCard
                        key={s.id}
                        s={s}
                        theme={theme}
                        onEdit={() => openEdit(s)}
                        onDismiss={() => handleDismiss(s.id)}
                        onAdd={() => addSuggestion(s)}
                      />
                    ))}
                  </>
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
      )}

      <EditModal
        visible={editVisible}
        state={editState}
        onSave={handleEditSave}
        onCancel={() => { setEditVisible(false); setEditState(null); }}
        theme={theme}
      />

      <ProLockModal
        visible={lockModal.visible}
        featureName={lockModal.featureName}
        onClose={() => setLockModal({ visible: false, featureName: '' })}
      />
    </View>
  );
}

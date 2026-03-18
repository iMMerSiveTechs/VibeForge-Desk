import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Calendar, Check } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import StageSafeHeader from '@/components/StageSafeHeader';
import useMeetingStore from '@/lib/state/meetingStore';

// ---------------------------------------------------------------------------
// Date formatting helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeRange(startIso: string, endIso: string, allDay: boolean): string {
  if (allDay) return 'All Day';
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

// ---------------------------------------------------------------------------
// Meeting Detail Screen
// ---------------------------------------------------------------------------

export default function MeetingDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const getMeeting = useMeetingStore((s) => s.getMeeting);
  const updateLocalNotes = useMeetingStore((s) => s.updateLocalNotes);

  const meeting = getMeeting(eventId ?? '');

  const [notes, setNotes] = useState<string>(meeting?.localNotes ?? '');
  const [saved, setSaved] = useState<boolean>(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync notes if meeting loads after mount (edge case)
  useEffect(() => {
    if (meeting && notes === '' && meeting.localNotes !== '') {
      setNotes(meeting.localNotes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleNotesChange = (text: string) => {
    setNotes(text);
    setSaved(false);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (eventId) {
        updateLocalNotes(eventId, text);
      }
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  if (!meeting) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk }}>
        <StageSafeHeader title="Meeting" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: theme.muted }}>Meeting not found.</Text>
        </View>
      </View>
    );
  }

  const accentColor = meeting.cachedCalendarColor ?? theme.spineAccent;
  const title =
    meeting.cachedTitle.length > 24
      ? meeting.cachedTitle.slice(0, 24) + '…'
      : meeting.cachedTitle;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.desk }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StageSafeHeader title={title} onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Event metadata card                                                  */}
        {/* ------------------------------------------------------------------ */}
        <View
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: theme.border,
            marginTop: 16,
            marginBottom: 24,
            flexDirection: 'row',
            overflow: 'hidden',
          }}
        >
          {/* Left accent bar */}
          <View
            style={{
              width: 4,
              backgroundColor: accentColor,
            }}
          />

          {/* Card body */}
          <View style={{ flex: 1, padding: 16, gap: 10 }}>
            {/* Full title (not truncated here) */}
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: theme.textOnDesk,
                fontFamily: 'serif',
                lineHeight: 22,
              }}
            >
              {meeting.cachedTitle}
            </Text>

            {/* Date + time row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Calendar size={14} color={accentColor} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.textOnDesk,
                    lineHeight: 18,
                  }}
                >
                  {formatDate(meeting.cachedStartDate)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.muted,
                    marginTop: 1,
                  }}
                >
                  {formatTimeRange(meeting.cachedStartDate, meeting.cachedEndDate, meeting.cachedAllDay)}
                </Text>
              </View>
            </View>

            {/* Location */}
            {meeting.cachedLocation ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color={theme.muted} />
                <Text
                  style={{ fontSize: 13, color: theme.muted, flex: 1 }}
                  numberOfLines={2}
                >
                  {meeting.cachedLocation}
                </Text>
              </View>
            ) : null}

            {/* Calendar name badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: accentColor + '1A',
                  borderRadius: 8,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderWidth: 0.5,
                  borderColor: accentColor + '44',
                  alignSelf: 'flex-start',
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: accentColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: accentColor,
                    letterSpacing: 0.2,
                  }}
                >
                  {meeting.cachedCalendarName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Meeting Notes section                                                */}
        {/* ------------------------------------------------------------------ */}

        {/* Section label row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 2,
              color: theme.muted,
              textTransform: 'uppercase',
              flex: 1,
            }}
          >
            Meeting Notes
          </Text>
          {saved ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Check size={12} color={theme.plannerGreen} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: theme.plannerGreen,
                  letterSpacing: 0.3,
                }}
              >
                Saved
              </Text>
            </View>
          ) : null}
        </View>

        {/* Notes TextInput — notepad feel */}
        <View
          style={{
            backgroundColor: theme.paper,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: theme.border,
            overflow: 'hidden',
          }}
        >
          {/* Ruled line decorations (top strip) */}
          <View
            style={{
              height: 3,
              backgroundColor: accentColor + '33',
            }}
          />
          <TextInput
            value={notes}
            onChangeText={handleNotesChange}
            multiline
            placeholder="Add notes, action items, follow-ups..."
            placeholderTextColor={theme.ink + '55'}
            style={{
              fontSize: 14,
              lineHeight: 22,
              color: theme.ink,
              padding: 16,
              minHeight: 200,
              textAlignVertical: 'top',
            }}
            scrollEnabled={false}
          />
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Footer                                                               */}
        {/* ------------------------------------------------------------------ */}
        <Text
          style={{
            fontSize: 11,
            color: theme.muted,
            opacity: 0.5,
            textAlign: 'center',
            marginTop: 24,
            letterSpacing: 0.2,
          }}
        >
          Linked to iOS Calendar · Read-only sync
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

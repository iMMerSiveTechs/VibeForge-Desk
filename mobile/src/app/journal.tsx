import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, BookOpen, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { createItem, fmtDate } from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';
import { deferredNavigate } from '@/lib/navigation';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
}

function calcStreak(entries: { createdAt: string }[]): number {
  if (entries.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD) sorted descending
  const dates = Array.from(
    new Set(entries.map((e) => e.createdAt.slice(0, 10))),
  ).sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Streak must start from today or yesterday
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffMs = prev.getTime() - curr.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function JournalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [todayEntry, setTodayEntry] = useState<string | null>(null);

  const itemsById = useDeskStore((s) => s.itemsById);
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const journalOrder = useDeskStore((s) => s.orderByKind.journal ?? []);

  const journalItems = useMemo(() => {
    return journalOrder.map((id) => itemsById[id]).filter(Boolean);
  }, [journalOrder, itemsById]);

  const streak = useMemo(() => calcStreak(journalItems), [journalItems]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayJournal = journalItems.find(
      (j) => j.body.includes(`Date: ${today}`) || j.title.includes(today),
    );
    setTodayEntry(todayJournal?.id ?? null);
  }, [journalItems]);

  const handleCreateToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item = createItem('journal');
    const today = fmtDate();
    item.title = `Journal Entry — ${today}`;
    item.body = `Date: ${new Date().toISOString().slice(0, 10)}\n\n`;
    upsertItem(item);
    deferredNavigate({ pathname: '/editor', params: { itemId: item.id, isNew: '1' } });
  };

  const todayItemData = todayEntry ? itemsById[todayEntry] : null;

  const streakBadge = streak > 0 ? (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.spineAccent + '22',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 0.5,
        borderColor: theme.spineAccent + '55',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>🔥</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.spineAccent }}>
        {streak} day{streak !== 1 ? 's' : ''}
      </Text>
    </View>
  ) : null;

  const plusButton = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {streakBadge}
      <Pressable
        onPress={handleCreateToday}
        style={{
          backgroundColor: theme.spineAccent,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <Plus size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  const pastEntries = journalItems.filter((j) => !todayEntry || j.id !== todayEntry);

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader
        title="Journal"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        rightActions={plusButton}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {/* Journal Pack CTA Banner */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            deferredNavigate('/(tabs)/studio');
          }}
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: 14,
            padding: 14,
            marginTop: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.spineAccent + '44',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: theme.spineAccent + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color={theme.spineAccent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textOnDesk, marginBottom: 2 }}>
              Journal Pro Pack
            </Text>
            <Text style={{ fontSize: 11, color: theme.muted, lineHeight: 15 }}>
              Daily Check-in, Gratitude, Thought Record + more
            </Text>
          </View>
        </Pressable>

        {/* TODAY */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 2,
              color: theme.muted,
              marginBottom: 10,
            }}
          >
            TODAY
          </Text>

          {todayItemData ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                deferredNavigate({ pathname: '/editor', params: { itemId: todayEntry! } });
              }}
              style={{
                backgroundColor: theme.plannerPaper,
                borderRadius: 14,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                minHeight: 130,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                <BookOpen size={14} color={theme.ruleBlue} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.ink, flex: 1 }} numberOfLines={1}>
                  {todayItemData.title}
                </Text>
              </View>
              <Text
                style={{ fontSize: 12, color: theme.ink, lineHeight: 18, opacity: 0.65 }}
                numberOfLines={3}
              >
                {stripMarkdown(todayItemData.body) || 'Tap to continue writing...'}
              </Text>
              <Text style={{ fontSize: 10, color: theme.ruleBlue, marginTop: 10, fontWeight: '600' }}>
                Tap to continue →
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCreateToday}
              style={{
                backgroundColor: theme.plannerPaper,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.ruleBlue,
                minHeight: 130,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Plus size={28} color={theme.ruleBlue} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.ruleBlue }}>
                Create Today's Entry
              </Text>
              <Text style={{ fontSize: 11, color: theme.muted, textAlign: 'center' }}>
                Free write or pick a template from Studio
              </Text>
            </Pressable>
          )}
        </View>

        {/* PAST ENTRIES */}
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 2,
              color: theme.muted,
              marginBottom: 10,
            }}
          >
            PAST ENTRIES ({pastEntries.length})
          </Text>

          {pastEntries.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 40,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: theme.spineAccent + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <BookOpen size={28} color={theme.spineAccent} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textOnDesk }}>
                Start your writing practice
              </Text>
              <Text style={{ fontSize: 12, color: theme.muted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 }}>
                Every entry you write builds a record of your thoughts. Begin today.
              </Text>
            </View>
          ) : (
            pastEntries.map((entry) => {
              const snippet = stripMarkdown(entry.body).slice(0, 120);
              const entryDate = new Date(entry.createdAt);
              const dayNum = entryDate.getDate();
              const monthShort = entryDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const dayOfWeek = entryDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

              return (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    deferredNavigate({ pathname: '/editor', params: { itemId: entry.id } });
                  }}
                  style={{
                    backgroundColor: theme.deskHl,
                    borderRadius: 14,
                    marginBottom: 10,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                    flexDirection: 'row',
                    overflow: 'hidden',
                    minHeight: 80,
                  }}
                >
                  {/* Left accent bar */}
                  <View
                    style={{
                      width: 4,
                      backgroundColor: theme.spineAccent,
                    }}
                  />
                  {/* Date column */}
                  <View
                    style={{
                      width: 52,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 14,
                      borderRightWidth: 0.5,
                      borderRightColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: theme.muted, letterSpacing: 0.5 }}>
                      {monthShort}
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: theme.textOnDesk, lineHeight: 28 }}>
                      {dayNum}
                    </Text>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: theme.muted, letterSpacing: 0.5 }}>
                      {dayOfWeek}
                    </Text>
                  </View>
                  {/* Content */}
                  <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, justifyContent: 'center' }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '700', color: theme.textOnDesk, marginBottom: 4 }}
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                    {snippet ? (
                      <Text
                        style={{ fontSize: 11, color: theme.muted, lineHeight: 16 }}
                        numberOfLines={2}
                      >
                        {snippet}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

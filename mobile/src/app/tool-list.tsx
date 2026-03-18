import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Plus,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  FileText,
  CheckSquare,
  StickyNote,
  BookOpen,
  ScanLine,
  Target,
  ExternalLink,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { createItem, taskProgress, fmtDate } from '@/lib/state/store';
import { KINDS, KIND_KEYS, type ItemKind } from '@/lib/constants';
import type { VFItem } from '@/lib/state/store';
import type { ThemeColors } from '@/lib/theme/themes';
import StageSafeHeader from '@/components/StageSafeHeader';
import { deferredNavigate } from '@/lib/navigation';
import { safeDismiss } from '@/lib/safeClose';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_IPAD = SCREEN_WIDTH >= 768;

// Stable empty array to prevent re-renders when kind order is empty
const EMPTY_ORDER: string[] = [];

// ---------------------------------------------------------------------------
// Helper: icon per kind
// ---------------------------------------------------------------------------

function kindIcon(kind: ItemKind, color: string, size: number = 16) {
  switch (kind) {
    case 'plan':
      return <FileText size={size} color={color} />;
    case 'task':
      return <CheckSquare size={size} color={color} />;
    case 'sticky':
      return <StickyNote size={size} color={color} />;
    case 'note':
      return <BookOpen size={size} color={color} />;
    case 'journal':
      return <BookOpen size={size} color={color} />;
    case 'goal':
      return <Target size={size} color={color} />;
    case 'vault':
      return <Archive size={size} color={color} />;
  }
}

function kindCardBg(kind: ItemKind, theme: ThemeColors): string {
  switch (kind) {
    case 'plan':
      return theme.coverPrimary;
    case 'task':
      return theme.plannerGreen;
    case 'sticky':
      return theme.stickyYellow;
    case 'note':
      return theme.paper;
    case 'vault':
      return theme.coverPrimary;
    case 'journal':
      return theme.plannerPaper;
    case 'goal':
      return theme.brandGreen;
  }
}

function kindPillTextColor(kind: ItemKind): string {
  switch (kind) {
    case 'plan':
      return '#FFFFFF';
    case 'task':
      return '#FFFFFF';
    case 'sticky':
      return '#1A1A1A';
    case 'note':
      return '#1A1A1A';
    case 'vault':
      return '#FFFFFF';
    case 'journal':
      return '#1A1A1A';
    case 'goal':
      return '#FFFFFF';
  }
}

function stickyCardColor(item: VFItem, theme: ThemeColors): string {
  return item.stickyMeta?.color === 'green' ? theme.stickyGreen : theme.stickyYellow;
}

// ---------------------------------------------------------------------------
// DropBar (slide-up bar with destination pills)
// ---------------------------------------------------------------------------

function DropBar({
  currentKind,
  onSelect,
  onCancel,
}: {
  currentKind: ItemKind;
  onSelect: (kind: ItemKind) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const otherKinds = KIND_KEYS.filter((k) => k !== currentKind);

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(200)}
      exiting={SlideOutDown.springify().damping(18).stiffness(200)}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 44,
        paddingTop: 16,
        paddingHorizontal: 16,
        backgroundColor: theme.deskHl,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1.5,
          color: theme.muted,
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        MOVE TO
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        {otherKinds.map((kind) => {
          const bg = kindCardBg(kind, theme);
          const textColor = kindPillTextColor(kind);
          return (
            <Pressable
              key={kind}
              onPress={() => onSelect(kind)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: bg,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                gap: 6,
                minWidth: (SCREEN_WIDTH - 64) / 3,
                justifyContent: 'center',
              }}
            >
              {kindIcon(kind, textColor, 14)}
              <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }} numberOfLines={1}>
                {KINDS[kind].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={onCancel}
        style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 20 }}
        hitSlop={12}
      >
        <Text style={{ fontSize: 14, color: theme.muted, fontWeight: '500' }}>Cancel</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// StickyCard — real sticky note card for grid layout
// ---------------------------------------------------------------------------

function StickyCard({
  item,
  onPress,
  onLongPress,
  isLifted,
  cardWidth,
}: {
  item: VFItem;
  onPress: () => void;
  onLongPress: () => void;
  isLifted: boolean;
  cardWidth: number;
}) {
  const theme = useTheme();
  const bgColor = stickyCardColor(item, theme);
  const scale = useSharedValue(1);
  const liftScale = useSharedValue(isLifted ? 1.03 : 1);

  React.useEffect(() => {
    liftScale.value = withSpring(isLifted ? 1.03 : 1, { damping: 15, stiffness: 300 });
  }, [isLifted, liftScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * liftScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: cardWidth,
            minHeight: cardWidth * 0.9,
            backgroundColor: bgColor,
            borderRadius: 4,
            padding: 12,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 3 },
            shadowOpacity: isLifted ? 0.4 : 0.18,
            shadowRadius: isLifted ? 12 : 5,
            elevation: isLifted ? 10 : 4,
            // Slight rotation for realism
            transform: [{ rotate: item.id.charCodeAt(0) % 2 === 0 ? '-1.2deg' : '1.5deg' }],
            borderTopWidth: 0,
            // Tape effect at top
            overflow: 'visible',
          },
        ]}
      >
        {/* Folded corner effect */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            borderTopLeftRadius: 6,
            backgroundColor: 'rgba(0,0,0,0.06)',
          }}
        />

        {/* Pinned dot */}
        {item.pinned ? (
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#555', marginBottom: 6,
            alignSelf: 'flex-end',
          }} />
        ) : null}

        {/* Title */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: 6,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.title || '(untitled)'}
        </Text>

        {/* Body preview */}
        <Text
          style={{ fontSize: 12, color: '#2A2A2A', lineHeight: 17, opacity: 0.8 }}
          numberOfLines={5}
        >
          {item.body || ''}
        </Text>

        {/* Tags */}
        {item.tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 8 }}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View
                key={`${tag}-${i}`}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, color: '#2A2A2A' }}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Date */}
        <Text style={{ fontSize: 10, color: '#3A3A3A', marginTop: 8, opacity: 0.6 }}>
          {fmtDate(new Date(item.updatedAt))}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ItemCard (generic list row for non-sticky kinds)
// ---------------------------------------------------------------------------

function ItemCard({
  item,
  onPress,
  onLongPress,
  isLifted,
  isSelected,
}: {
  item: VFItem;
  onPress: () => void;
  onLongPress: () => void;
  isLifted: boolean;
  isSelected?: boolean;
}) {
  const theme = useTheme();
  const togglePin = useDeskStore((s) => s.togglePin);
  const toggleArchive = useDeskStore((s) => s.toggleArchive);
  const deleteItem = useDeskStore((s) => s.deleteItem);
  const scale = useSharedValue(1);
  const liftScale = useSharedValue(isLifted ? 1.02 : 1);

  React.useEffect(() => {
    liftScale.value = withSpring(isLifted ? 1.02 : 1, { damping: 15, stiffness: 300 });
  }, [isLifted, liftScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * liftScale.value }],
  }));

  const liftShadowStyle = useAnimatedStyle(() => {
    const lifted = liftScale.value > 1.01;
    return {
      shadowOpacity: lifted ? 0.4 : 0,
      shadowRadius: lifted ? 16 : 0,
      elevation: lifted ? 12 : 0,
    };
  });

  const progress = item.kind === 'task' ? taskProgress(item) : null;

  const preview = useMemo(() => {
    if (item.kind === 'task' && progress) {
      return `${progress.done}/${progress.total} done`;
    }
    return item.body.slice(0, 80) || null;
  }, [item, progress]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title || '(untitled)'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
    >
      <Animated.View
        style={[
          animStyle,
          liftShadowStyle,
          {
            backgroundColor: theme.deskHl,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            borderWidth: isSelected ? 1.5 : (isLifted ? 1.5 : 0.5),
            borderColor: isSelected ? theme.spineAccent : (isLifted ? theme.brandGreen : theme.border),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: isLifted ? 8 : 0 },
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 1 }}>
          {item.pinned ? (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.brandGreen, marginRight: 6 }} />
          ) : null}
          {item.archived ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 }}>
              <Text style={{ fontSize: 10, color: theme.muted }}>archived</Text>
            </View>
          ) : null}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textOnDesk, marginBottom: 4 }} numberOfLines={1}>
          {item.title || '(untitled)'}
        </Text>

        {preview ? (
          <Text style={{ fontSize: 13, color: theme.muted, marginBottom: 6 }} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}

        {item.tags.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {item.tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={{ backgroundColor: theme.brandGreen + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: theme.brandGreen }}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.kind === 'task' && progress && progress.total > 0 ? (
          <View style={{ height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 8, overflow: 'hidden' }}>
            <View style={{ height: 3, borderRadius: 1.5, backgroundColor: theme.brandGreen, width: `${progress.pct}%` }} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: theme.muted }}>{fmtDate(new Date(item.updatedAt))}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => togglePin(item.id)} hitSlop={8}>
              {item.pinned ? <PinOff size={16} color={theme.muted} /> : <Pin size={16} color={theme.muted} />}
            </Pressable>
            <Pressable onPress={() => toggleArchive(item.id)} hitSlop={8}>
              {item.archived ? <ArchiveRestore size={16} color={theme.muted} /> : <Archive size={16} color={theme.muted} />}
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Trash2 size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Detail Preview Pane (iPad only)
// ---------------------------------------------------------------------------

function DetailPane({
  item,
  safeKind,
  onOpen,
  onNew,
}: {
  item: VFItem | null;
  safeKind: ItemKind;
  onOpen: () => void;
  onNew: () => void;
}) {
  const theme = useTheme();
  const meta = KINDS[safeKind];

  if (!item) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          borderLeftWidth: 1,
          borderLeftColor: theme.border,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: theme.deskHl,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          {kindIcon(safeKind, theme.muted, 32)}
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textOnDesk, textAlign: 'center', marginBottom: 8 }}>
          Select an item
        </Text>
        <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
          Tap any item in the list to preview it here.
        </Text>
        <Pressable
          onPress={onNew}
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: theme.brandGreen,
            paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
          }}
        >
          <Plus size={16} color="#000" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#000', marginLeft: 6 }}>
            New {meta.label}
          </Text>
        </Pressable>
      </View>
    );
  }

  const progress = item.kind === 'task' ? taskProgress(item) : null;
  const stickyBg = item.kind === 'sticky'
    ? (item.stickyMeta?.color === 'green' ? theme.stickyGreen : theme.stickyYellow)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: theme.border }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Kind badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: kindCardBg(item.kind, theme),
          alignItems: 'center', justifyContent: 'center',
        }}>
          {kindIcon(item.kind, kindPillTextColor(item.kind), 14)}
        </View>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: theme.muted }}>
          {meta.label.toUpperCase()}
        </Text>
      </View>

      {/* Sticky preview */}
      {stickyBg ? (
        <View style={{
          backgroundColor: stickyBg,
          borderRadius: 6,
          padding: 16,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
          transform: [{ rotate: '-1deg' }],
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>
            {item.title || '(untitled)'}
          </Text>
          <Text style={{ fontSize: 14, color: '#2A2A2A', lineHeight: 20 }} numberOfLines={8}>
            {item.body || 'No content yet.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Title */}
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textOnDesk, marginBottom: 6, letterSpacing: -0.5 }}>
            {item.title || '(untitled)'}
          </Text>
          {/* Date */}
          <Text style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
            {fmtDate(new Date(item.updatedAt))}
          </Text>

          {/* Task progress */}
          {progress && progress.total > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: theme.muted, fontWeight: '600' }}>Progress</Text>
                <Text style={{ fontSize: 12, color: theme.muted }}>{progress.done}/{progress.total} done</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: 'hidden' }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.brandGreen, width: `${progress.pct}%` }} />
              </View>
            </View>
          ) : null}

          {/* Tags */}
          {item.tags.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {item.tags.map((tag, i) => (
                <View key={`${tag}-${i}`} style={{ backgroundColor: theme.brandGreen + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.brandGreen }}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Body preview with paper/lining feel for plan/note */}
          {item.body ? (
            <View style={{
              backgroundColor: item.kind === 'plan' || item.kind === 'note' ? theme.paper : item.kind === 'task' ? theme.plannerPaper : theme.deskHl,
              borderRadius: 10,
              padding: 14,
              marginBottom: 8,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}>
              <Text style={{
                fontSize: 14, color: theme.ink, lineHeight: 22,
                fontFamily: item.kind === 'plan' || item.kind === 'note' ? 'serif' : undefined,
              }} numberOfLines={12}>
                {item.body}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* Tags for sticky */}
      {stickyBg && item.tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {item.tags.map((tag, i) => (
            <View key={`${tag}-${i}`} style={{ backgroundColor: theme.brandGreen + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: theme.brandGreen }}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* CTAs */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={onOpen}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.brandGreen,
            paddingVertical: 13, borderRadius: 12,
            shadowColor: theme.brandGreen, shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 8,
          }}
        >
          <ExternalLink size={16} color="#000" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#000', marginLeft: 6 }}>Open</Text>
        </Pressable>
        <Pressable
          onPress={onNew}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.deskHl,
            paddingVertical: 13, borderRadius: 12,
            borderWidth: 1, borderColor: theme.border,
          }}
        >
          <Plus size={16} color={theme.textOnDesk} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textOnDesk, marginLeft: 6 }}>New</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ToolListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const safeKind = (KIND_KEYS.includes(kind as ItemKind) ? kind : 'plan') as ItemKind;
  const meta = KINDS[safeKind];

  const upsertItem = useDeskStore((s) => s.upsertItem);
  const convertItem = useDeskStore((s) => s.convertItem);
  const deleteItem = useDeskStore((s) => s.deleteItem);
  const togglePin = useDeskStore((s) => s.togglePin);
  const toggleArchive = useDeskStore((s) => s.toggleArchive);
  const itemsById = useDeskStore((s) => s.itemsById);
  const kindOrder = useDeskStore((s) => s.orderByKind[safeKind]) ?? EMPTY_ORDER;

  const [moveModeItemId, setMoveModeItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const items = useMemo(() => {
    return kindOrder.map((id) => itemsById[id]).filter(Boolean) as VFItem[];
  }, [kindOrder, itemsById]);

  const sortedItems = useMemo(() => {
    const pinnedActive = items.filter((i) => i.pinned && !i.archived);
    const active = items.filter((i) => !i.pinned && !i.archived);
    const archived = items.filter((i) => i.archived);
    return [...pinnedActive, ...active, ...archived];
  }, [items]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return itemsById[selectedItemId] ?? null;
  }, [selectedItemId, itemsById]);

  const handleNewItem = () => {
    const item = createItem(safeKind);
    upsertItem(item);
    deferredNavigate({ pathname: '/editor', params: { itemId: item.id, isNew: '1' } });
  };

  const handleLongPress = useCallback((item: VFItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isPinned = item.pinned;
    const isArchived = item.archived;

    Alert.alert(
      item.title || '(untitled)',
      undefined,
      [
        {
          text: 'Open',
          onPress: () => deferredNavigate({ pathname: '/editor', params: { itemId: item.id } }),
        },
        {
          text: isPinned ? 'Unpin' : 'Pin to top',
          onPress: () => {
            togglePin(item.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: isArchived ? 'Restore' : 'Archive',
          onPress: () => {
            toggleArchive(item.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: 'Move to...',
          onPress: () => setMoveModeItemId(item.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Item',
              `Delete "${item.title || '(untitled)'}"? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteItem(item.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  },
                },
              ],
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [deleteItem, togglePin, toggleArchive]);

  const handleMoveSelect = useCallback(
    (targetKind: ItemKind) => {
      if (!moveModeItemId) return;
      convertItem(moveModeItemId, targetKind);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMoveModeItemId(null);
    },
    [moveModeItemId, convertItem],
  );

  const handleMoveCancel = useCallback(() => {
    setMoveModeItemId(null);
  }, []);

  const handleItemPress = useCallback(
    (item: VFItem) => {
      if (moveModeItemId) {
        setMoveModeItemId(null);
        return;
      }
      if (IS_IPAD) {
        // On iPad: select for preview
        setSelectedItemId((prev) => (prev === item.id ? null : item.id));
      } else {
        // On phone: navigate directly
        deferredNavigate({ pathname: '/editor', params: { itemId: item.id } });
      }
    },
    [moveModeItemId, router],
  );

  const handleOpenSelected = useCallback(() => {
    if (!selectedItem) return;
    deferredNavigate({ pathname: '/editor', params: { itemId: selectedItem.id } });
  }, [selectedItem, router]);

  // Right-side actions for header
  const headerRight = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable
        onPress={() => {
          Alert.alert('Scan to Desk', 'Choose a source', [
            { text: 'Camera', onPress: () => router.push({ pathname: '/scan-preview', params: { source: 'camera' } }) },
            { text: 'Photo Library', onPress: () => router.push({ pathname: '/scan-preview', params: { source: 'library' } }) },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        style={{ backgroundColor: theme.muted + '22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
      >
        <ScanLine size={16} color={theme.muted} />
      </Pressable>
      <Pressable
        onPress={handleNewItem}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.brandGreen + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
      >
        <Plus size={16} color={theme.brandGreen} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.brandGreen, marginLeft: 4 }}>New</Text>
      </Pressable>
    </View>
  );

  // Sticky grid column count
  const stickyColCount = IS_IPAD ? 2 : (SCREEN_WIDTH >= 360 ? 2 : 1);
  const stickyCardWidth = IS_IPAD
    ? ((SCREEN_WIDTH * 0.42) - 32 - (stickyColCount - 1) * 10) / stickyColCount
    : (SCREEN_WIDTH - 32 - (stickyColCount - 1) * 10) / stickyColCount;

  // Empty state
  const emptyState = (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.brandGreen + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        {kindIcon(safeKind, theme.brandGreen, 28)}
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textOnDesk, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 }}>
        {`No ${meta.label} yet`}
      </Text>
      <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
        {`Create your first ${meta.label.toLowerCase()} to get started.`}
      </Text>
      <Pressable
        onPress={handleNewItem}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: theme.brandGreen,
          paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
          shadowColor: theme.brandGreen, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
        }}
      >
        <Plus size={18} color="#000" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginLeft: 8 }}>
          {`New ${meta.label}`}
        </Text>
      </Pressable>
    </View>
  );

  // List content
  const listContent = (
    <>
      {sortedItems.length === 0 ? emptyState : null}

      {safeKind === 'sticky' ? (
        // Sticky GRID layout
        <View>
          {/* Render sticky cards in rows of stickyColCount */}
          {Array.from({ length: Math.ceil(sortedItems.length / stickyColCount) }, (_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: 'row', gap: 10 }}>
              {sortedItems.slice(rowIdx * stickyColCount, rowIdx * stickyColCount + stickyColCount).map((item) => (
                <StickyCard
                  key={item.id}
                  item={item}
                  cardWidth={stickyCardWidth}
                  isLifted={moveModeItemId === item.id}
                  onPress={() => handleItemPress(item)}
                  onLongPress={() => handleLongPress(item)}
                />
              ))}
            </View>
          ))}
        </View>
      ) : (
        // Generic list
        sortedItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isLifted={moveModeItemId === item.id}
            isSelected={IS_IPAD ? selectedItemId === item.id : false}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        ))
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      {/* Stage-safe header */}
      <StageSafeHeader
        title={meta.label}
        onBack={() => safeDismiss(router)}
        rightActions={headerRight}
      />

      {/* Body: split on iPad, single col on phone */}
      <View style={{ flex: 1, flexDirection: IS_IPAD ? 'row' : 'column' }}>
        {/* Left / main list */}
        <View style={{ flex: IS_IPAD ? 0.42 : 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: moveModeItemId ? 180 : 30,
              paddingTop: 8,
            }}
          >
            {listContent}
          </ScrollView>
        </View>

        {/* Right pane — iPad only */}
        {IS_IPAD ? (
          <View style={{ flex: 0.58 }}>
            <DetailPane
              item={selectedItem}
              safeKind={safeKind}
              onOpen={handleOpenSelected}
              onNew={handleNewItem}
            />
          </View>
        ) : null}
      </View>

      {/* Dim overlay when in move mode */}
      {moveModeItemId ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', pointerEvents: 'box-none' }}
        />
      ) : null}

      {/* Drop bar */}
      {moveModeItemId ? (
        <DropBar currentKind={safeKind} onSelect={handleMoveSelect} onCancel={handleMoveCancel} />
      ) : null}
    </View>
  );
}

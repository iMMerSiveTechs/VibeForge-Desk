import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Alert, ScrollView, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { deferredNavigate } from '@/lib/navigation';
import {
  Search,
  Clock,
  MapPin,
  ScanLine,
  Palette,
  Command,
  Plus,
  X,
  FileText,
  CheckSquare,
  BookOpen,
  Archive,
  Target,
  StickyNote,
  Layers,
  CalendarDays,
  FolderOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePackTokens } from '@/lib/theme/PackTokensContext';
import useDeskStore from '@/lib/state/store';
import { globalTaskProgress, fmtDay, createItem } from '@/lib/state/store';
import type { ShelfItem } from '@/lib/state/store';
import { KINDS, KIND_REGISTRY, KIND_KEYS, type ItemKind, type CoreKind } from '@/lib/constants';
import { TactileButton } from '@/components/Tactile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 14;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;
const CARD_HEIGHT = 190;

// ---------------------------------------------------------------------------
// Shelf icon helper
// ---------------------------------------------------------------------------

function shelfIcon(iconName: string, color: string, size: number = 15): React.ReactNode {
  switch (iconName) {
    case 'FileText': return <FileText size={size} color={color} />;
    case 'CheckSquare': return <CheckSquare size={size} color={color} />;
    case 'BookOpen': return <BookOpen size={size} color={color} />;
    case 'Archive': return <Archive size={size} color={color} />;
    case 'Target': return <Target size={size} color={color} />;
    case 'StickyNote': return <StickyNote size={size} color={color} />;
    case 'Palette': return <Palette size={size} color={color} />;
    case 'MapPin': return <MapPin size={size} color={color} />;
    case 'Clock': return <Clock size={size} color={color} />;
    case 'Layers': return <Layers size={size} color={color} />;
    case 'CalendarDays': return <CalendarDays size={size} color={color} />;
    case 'FolderOpen': return <FolderOpen size={size} color={color} />;
    default: return <FileText size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// ALL available shelf options
// ---------------------------------------------------------------------------

const ALL_SHELF_OPTIONS: ShelfItem[] = [
  { id: 'plan', label: 'Plan', icon: 'FileText' },
  { id: 'task', label: 'Task', icon: 'CheckSquare' },
  { id: 'sticky', label: 'Sticky', icon: 'StickyNote' },
  { id: 'note', label: 'Notes', icon: 'BookOpen' },
  { id: 'vault', label: 'Vault', icon: 'Archive' },
  { id: 'journal', label: 'Journal', icon: 'BookOpen' },
  { id: 'goal', label: 'Goals', icon: 'Target' },
  { id: 'studio', label: 'Studio', icon: 'Palette' },
  { id: 'canvas', label: 'Canvas', icon: 'MapPin' },
  { id: 'activity', label: 'Activity', icon: 'Clock' },
  { id: 'calendar', label: 'Calendar', icon: 'CalendarDays' },
  { id: 'workspace', label: 'Workspace', icon: 'FolderOpen' },
];

function shelfItemRoute(id: string): string {
  switch (id) {
    case 'studio': return '/(tabs)/studio';
    case 'canvas': return '/canvas';
    case 'activity': return '/activity';
    case 'calendar': return '/calendar';
    case 'workspace': return '/vault-os';
    default: return `/tool-list?kind=${id}`;
  }
}

// ---------------------------------------------------------------------------
// Quick Shelf
// ---------------------------------------------------------------------------

function QuickShelf() {
  const theme = useTheme();
  const shelfItems = useDeskStore((s) => s.shelfItems);
  const setShelfItems = useDeskStore((s) => s.setShelfItems);
  const removeShelfItem = useDeskStore((s) => s.removeShelfItem);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const sheetY = useSharedValue(400);

  useEffect(() => {
    if (pickerVisible) {
      sheetY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      sheetY.value = 400;
    }
  }, [pickerVisible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const handleAddItem = useCallback((item: ShelfItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShelfItems([...shelfItems, item]);
    setPickerVisible(false);
  }, [shelfItems, setShelfItems]);

  const available = ALL_SHELF_OPTIONS.filter((o) => !shelfItems.find((s) => s.id === o.id));

  return (
    <View style={{ marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {shelfItems.map((item) => {
          const isLongPressed = longPressId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (longPressId === item.id) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  removeShelfItem(item.id);
                  setLongPressId(null);
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const route = shelfItemRoute(item.id);
                if (route.includes('?')) {
                  const [path, qs] = route.split('?');
                  const params = Object.fromEntries(new URLSearchParams(qs));
                  deferredNavigate({ pathname: path as any, params });
                } else {
                  deferredNavigate(route as any);
                }
              }}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setLongPressId(item.id);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isLongPressed ? 'rgba(255,60,60,0.18)' : theme.deskHl,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 0.5,
                borderColor: isLongPressed ? 'rgba(255,60,60,0.4)' : theme.border,
                gap: 6,
              }}
            >
              {shelfIcon(item.icon, isLongPressed ? '#FF3C3C' : theme.textOnDesk)}
              <Text style={{ fontSize: 13, fontWeight: '600', color: isLongPressed ? '#FF3C3C' : theme.textOnDesk }}>
                {item.label}
              </Text>
              {isLongPressed ? (
                <View>
                  <X size={13} color="#FF3C3C" />
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {/* Add chip */}
        <Pressable
          onPress={() => setPickerVisible(true)}
          hitSlop={4}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.deskHl,
            borderWidth: 0.5,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={16} color={theme.muted} />
        </Pressable>
      </ScrollView>

      {/* Add to shelf picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="none"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setPickerVisible(false)}
        >
          <Animated.View
            style={[
              {
                backgroundColor: theme.deskHl,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTopWidth: 0.5,
                borderTopColor: theme.border,
                padding: 20,
                paddingBottom: 40,
              },
              sheetAnimatedStyle,
            ]}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.border,
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 2,
                color: theme.muted,
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              ADD TO SHELF
            </Text>
            {available.length === 0 ? (
              <Text style={{ fontSize: 14, color: theme.muted, textAlign: 'center' }}>
                All shortcuts are already on your shelf.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {available.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleAddItem(opt)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.desk,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderWidth: 0.5,
                      borderColor: theme.border,
                      gap: 7,
                    }}
                  >
                    {shelfIcon(opt.icon, theme.spineAccent)}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textOnDesk }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stack Card
// ---------------------------------------------------------------------------

function StackCard({ kind, onPress }: { kind: CoreKind; onPress: () => void }) {
  const theme = useTheme();
  const pack = usePackTokens();
  const scale = useSharedValue(1);
  // Select primitive length directly to avoid snapshot issues
  const count = useDeskStore((s) => {
    const order = s.orderByKind[kind];
    return order ? order.length : 0;
  });

  const itemsById = useDeskStore((s) => s.itemsById);
  const kindOrder = useDeskStore((s) => s.orderByKind[kind]);
  const recentItems = React.useMemo(() => {
    const order = kindOrder ?? [];
    return order
      .map((id) => itemsById[id])
      .filter((item): item is NonNullable<typeof item> => Boolean(item) && !item.archived)
      .slice(0, 3);
  }, [kindOrder, itemsById]);
  const gtp = React.useMemo(() => {
    if (kind !== 'task') return null;
    let done = 0;
    let total = 0;
    const taskIds = kindOrder ?? [];
    for (const id of taskIds) {
      const item = itemsById[id];
      if (item && !item.archived && item.taskData) {
        const tasks = item.taskData.tasks;
        total += tasks.length;
        done += tasks.filter((t) => t.done).length;
      }
    }
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [kind, itemsById, kindOrder]);

  const meta = KINDS[kind];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const cardBg = React.useMemo(() => {
    switch (kind) {
      case 'plan':
        return theme.coverPrimary;
      case 'task':
        return theme.plannerGreen;
      case 'sticky':
        return theme.stickyYellow;
      case 'note':
        return theme.paper;
    }
  }, [kind, theme]);

  const textColor = kind === 'sticky' || kind === 'note' ? theme.ink : '#FFFFFF';
  const mutedTextColor =
    kind === 'sticky' || kind === 'note' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';

  return (
    <Pressable
      onPress={() => {
        onPress();
        deferredNavigate({ pathname: '/tool-list', params: { kind } });
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: pack.cardRadius,
            backgroundColor: cardBg,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
            shadowOpacity: pack.cardShadowOpacity,
            shadowRadius: pack.cardShadowRadius,
            elevation: Math.round(pack.cardShadowOpacity * 20),
          },
        ]}
      >
          {/* Spine for plan */}
          {kind === 'plan' ? (
            <View
              className="absolute left-0 top-0 bottom-0"
              style={{ width: 6, backgroundColor: theme.spineAccent }}
            />
          ) : null}

          {/* Marble veins for plan */}
          {kind === 'plan' ? (
            <>
              <View
                className="absolute"
                style={{
                  top: 20, left: 30, width: 80, height: 1,
                  backgroundColor: theme.coverMarble,
                  transform: [{ rotate: '25deg' }],
                  opacity: 0.5,
                }}
              />
              <View
                className="absolute"
                style={{
                  top: 60, left: 50, width: 60, height: 1,
                  backgroundColor: theme.coverMarble,
                  transform: [{ rotate: '-15deg' }],
                  opacity: 0.4,
                }}
              />
              <View
                className="absolute"
                style={{
                  top: 100, left: 20, width: 100, height: 1,
                  backgroundColor: theme.coverMarble,
                  transform: [{ rotate: '35deg' }],
                  opacity: 0.3,
                }}
              />
            </>
          ) : null}

          {/* Lined texture for note */}
          {kind === 'note' ? (
            <View className="absolute inset-0" style={{ opacity: 0.15 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: 40 + i * 22,
                    left: 0, right: 0, height: 1,
                    backgroundColor: theme.ruleBlue,
                  }}
                />
              ))}
              <View
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0, left: 28, width: 1,
                  backgroundColor: theme.marginRed,
                  opacity: 0.6,
                }}
              />
            </View>
          ) : null}

          {/* Pack bg overlay */}
          {pack.bgOverlay !== 'none' && pack.bgOverlayOpacity > 0 ? (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: pack.bgOverlayOpacity, zIndex: 1 }}>
              {pack.bgOverlay === 'lines' ? (
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ position: 'absolute', top: 28 + i * 26, left: 0, right: 0, height: 1, backgroundColor: '#000' }} />
                ))
              ) : pack.bgOverlay === 'blueprint' ? (
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ position: 'absolute', top: 28 + i * 26, left: 0, right: 0, height: 0.5, backgroundColor: '#fff' }} />
                ))
              ) : pack.bgOverlay === 'noise' ? (
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <View key={i} style={{ position: 'absolute', top: 20 + Math.floor(i / 4) * 50, left: 10 + (i % 4) * 40, width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' }} />
                ))
              ) : null}
            </View>
          ) : null}

          {/* 2.5D hairline highlight */}
          <View
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              backgroundColor: 'rgba(255,255,255,0.22)', zIndex: 2,
            }}
          />
          <View
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 1,
              backgroundColor: 'rgba(255,255,255,0.12)', zIndex: 2,
            }}
          />

          {/* Content */}
          <View className="flex-1 px-3 pt-3 pb-2 justify-between" style={{ marginLeft: kind === 'plan' ? 6 : 0 }}>
            {/* Label plate */}
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor:
                  kind === 'plan'
                    ? theme.labelPlate
                    : kind === 'task'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.08)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
                  color:
                    kind === 'plan'
                      ? theme.ink
                      : kind === 'task'
                        ? 'rgba(255,255,255,0.9)'
                        : 'rgba(0,0,0,0.5)',
                }}
              >
                {meta.deskLabel}
              </Text>
            </View>

            {/* Recent items list */}
            {recentItems.length > 0 ? (
              <View style={{ gap: 3, marginTop: 6 }}>
                {recentItems.map((item) => (
                  <Text
                    key={item.id}
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: textColor,
                      opacity: 0.7,
                      fontWeight: '500',
                    }}
                  >
                    · {item.title || 'Untitled'}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Bottom */}
            <View>
              <Text
                style={{
                  fontSize: 17, fontWeight: '700', color: textColor,
                  fontFamily: 'serif', marginBottom: 2,
                }}
              >
                {meta.label}
              </Text>
              <Text style={{ fontSize: 12, color: mutedTextColor }}>
                {count} {count === 1 ? 'item' : 'items'}
              </Text>
              {kind === 'task' && gtp && gtp.total > 0 ? (
                <View
                  style={{
                    marginTop: 6, height: 4, borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: 4, borderRadius: 2,
                      backgroundColor: '#FFFFFF',
                      width: `${gtp.pct}%`,
                    }}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Canvas Hero Card (first/largest card on desk)
// ---------------------------------------------------------------------------

function CanvasHeroCard() {
  const theme = useTheme();
  const pack = usePackTokens();
  const pins = useDeskStore((s) => s.pinboard.pins);
  const itemsById = useDeskStore((s) => s.itemsById);
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const addPin = useDeskStore((s) => s.addPin);

  const previewPins = React.useMemo(() => {
    return pins
      .filter((p) => itemsById[p.itemId])
      .slice(0, 4);
  }, [pins, itemsById]);

  const pinCount = pins.filter((p) => itemsById[p.itemId]).length;

  const handleNewPin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.prompt(
      'New Pin',
      'Enter a title for your pin',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (title) => {
            if (!title?.trim()) return;
            const item = createItem('plan');
            item.title = title.trim();
            upsertItem(item);
            addPin({
              id: item.id + '_pin',
              itemId: item.id,
              x: 40 + Math.random() * 100,
              y: 60 + Math.random() * 80,
              w: 200,
              h: 130,
              z: pins.length,
            });
          },
        },
      ],
      'plain-text',
    );
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deferredNavigate('/canvas');
      }}
      style={({ pressed }) => ({
        marginTop: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.brandGreen,
        shadowColor: theme.brandGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
        opacity: pressed ? 0.88 : 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      })}
    >
      <View style={{ borderRadius: 14 }}>
      {/* Green top accent bar */}
      <View pointerEvents="none" style={{ height: 3, backgroundColor: theme.brandGreen }} />

      {/* Dot grid background */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 3, left: 0, right: 0, bottom: 0, opacity: 0.05, zIndex: 0 }}>
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 14 }, (_, col) => (
            <View
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                top: 10 + row * 16,
                left: 10 + col * 26,
                width: 3, height: 3, borderRadius: 1.5,
                backgroundColor: theme.brandGreen,
              }}
            />
          )),
        )}
      </View>

      <View style={{ padding: 18, paddingTop: 16 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              width: 42, height: 42, borderRadius: 12,
              backgroundColor: theme.brandGreen + '22',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <MapPin size={22} color={theme.brandGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
                color: theme.brandGreen, marginBottom: 2,
              }}
            >
              CANVAS
            </Text>
            <Text
              style={{
                fontSize: 20, fontWeight: '800',
                color: theme.textOnDesk, fontFamily: 'serif',
                letterSpacing: -0.3,
              }}
            >
              Canvas
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10, paddingVertical: 4,
              backgroundColor: theme.brandGreen + '18',
              borderRadius: 10,
              borderWidth: 0.5,
              borderColor: theme.brandGreen + '44',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.brandGreen }}>
              {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
            </Text>
          </View>
        </View>

        {/* Pin preview chips */}
        {previewPins.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
            {previewPins.map((pin) => {
              const item = itemsById[pin.itemId];
              if (!item) return null;
              return (
                <View
                  key={pin.id}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: theme.brandGreen + '14',
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: theme.brandGreen + '33',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <MapPin size={10} color={theme.brandGreen} />
                  <Text
                    style={{
                      fontSize: 12, fontWeight: '600',
                      color: theme.textOnDesk,
                    }}
                    numberOfLines={1}
                  >
                    {item.title || 'Untitled'}
                  </Text>
                </View>
              );
            })}
            {pinCount > 4 ? (
              <View
                style={{
                  paddingHorizontal: 10, paddingVertical: 6,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontSize: 12, color: theme.muted }}>+{pinCount - 4} more</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View
            style={{
              paddingVertical: 14,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center' }}>
              No pins yet. Tap to open the Canvas.
            </Text>
          </View>
        )}

      </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Vault Wide Card
// ---------------------------------------------------------------------------

function VaultCard() {
  const theme = useTheme();
  const pack = usePackTokens();
  const itemsById = useDeskStore((s) => s.itemsById);
  const vaultIds = useDeskStore((s) => s.orderByKind.vault ?? []);
  const archivedCount = React.useMemo(() => {
    return vaultIds.filter((id) => itemsById[id]?.archived).length;
  }, [vaultIds, itemsById]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deferredNavigate('/vault');
      }}
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: pack.cardRadius,
        padding: 16,
        marginTop: 14,
        borderWidth: pack.cardBorderWidth,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
        shadowOpacity: pack.cardShadowOpacity * 0.6,
        shadowRadius: pack.cardShadowRadius,
        elevation: Math.round(pack.cardShadowOpacity * 10),
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: 4,
          backgroundColor: theme.muted,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
        }}
      />
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: theme.muted + '22',
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, marginRight: 14,
        }}
      >
        <Archive size={20} color={theme.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.muted, marginBottom: 2 }}>
          ARCHIVE
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
          Vault
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted }}>Searchable archive</Text>
      </View>
      <Text style={{ fontSize: 13, color: theme.muted }}>
        {archivedCount} {archivedCount === 1 ? 'item' : 'items'}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Journal Wide Card
// ---------------------------------------------------------------------------

function JournalCard() {
  const theme = useTheme();
  const pack = usePackTokens();
  const journalCount = useDeskStore((s) => (s.orderByKind.journal ?? []).length);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deferredNavigate('/journal');
      }}
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: pack.cardRadius,
        padding: 16,
        marginTop: 14,
        borderWidth: pack.cardBorderWidth,
        borderColor: theme.spineAccent + '44',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
        shadowOpacity: pack.cardShadowOpacity * 0.6,
        shadowRadius: pack.cardShadowRadius,
        elevation: Math.round(pack.cardShadowOpacity * 10),
      }}
    >
      {/* Left accent bar */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: 4,
          backgroundColor: theme.spineAccent,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
        }}
      />
      {/* Lined texture */}
      <View style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: 16 + i * 18,
              left: 60, right: 0, height: 1,
              backgroundColor: theme.ruleBlue,
            }}
          />
        ))}
      </View>
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: theme.spineAccent + '22',
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, marginRight: 14,
        }}
      >
        <BookOpen size={20} color={theme.spineAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.muted, marginBottom: 2 }}>
          DAILY WRITE
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
          Journal
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted }}>Today's free-write</Text>
      </View>
      <Text style={{ fontSize: 13, color: theme.muted }}>
        {journalCount} {journalCount === 1 ? 'entry' : 'entries'}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Goals Wide Card
// ---------------------------------------------------------------------------

function GoalsCard() {
  const theme = useTheme();
  const pack = usePackTokens();
  const goalIds = useDeskStore((s) => s.orderByKind.goal ?? []);
  const itemsById = useDeskStore((s) => s.itemsById);

  const { goalCount, avgPct } = React.useMemo(() => {
    const goals = goalIds.map((id) => itemsById[id]).filter(Boolean);
    if (goals.length === 0) return { goalCount: 0, avgPct: 0 };
    let total = 0;
    for (const g of goals) {
      try {
        const data = g.body ? JSON.parse(g.body) : {};
        total += Math.min(Math.max(data.progress || 0, 0), 100);
      } catch {
        // skip
      }
    }
    return { goalCount: goals.length, avgPct: Math.round(total / goals.length) };
  }, [goalIds, itemsById]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deferredNavigate('/goals');
      }}
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: pack.cardRadius,
        padding: 16,
        marginTop: 14,
        borderWidth: pack.cardBorderWidth,
        borderColor: theme.brandGreen + '44',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
        shadowOpacity: pack.cardShadowOpacity * 0.6,
        shadowRadius: pack.cardShadowRadius,
        elevation: Math.round(pack.cardShadowOpacity * 10),
      }}
    >
      {/* Left accent bar */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: 4,
          backgroundColor: theme.brandGreen,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
        }}
      />
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: theme.brandGreen + '22',
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, marginRight: 14,
        }}
      >
        <Target size={20} color={theme.brandGreen} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.muted, marginBottom: 2 }}>
          OKR BOARD
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
          Goals
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted }}>Track your key results</Text>
        {goalCount > 0 ? (
          <View style={{ marginTop: 6, height: 4, borderRadius: 2, backgroundColor: theme.brandGreen + '28', overflow: 'hidden', width: '80%' }}>
            <View
              style={{
                height: 4, borderRadius: 2,
                backgroundColor: theme.brandGreen,
                width: `${avgPct}%`,
              }}
            />
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontSize: 13, color: theme.muted }}>
          {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
        </Text>
        {goalCount > 0 ? (
          <Text style={{ fontSize: 11, color: theme.brandGreen, fontWeight: '600' }}>
            {avgPct}% avg
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Calendar Wide Card
// ---------------------------------------------------------------------------

function CalendarCard() {
  const theme = useTheme();
  const pack = usePackTokens();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deferredNavigate('/calendar');
      }}
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: pack.cardRadius,
        padding: 16,
        marginTop: 14,
        borderWidth: pack.cardBorderWidth,
        borderColor: theme.spineAccent + '44',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
        shadowOpacity: pack.cardShadowOpacity * 0.6,
        shadowRadius: pack.cardShadowRadius,
        elevation: Math.round(pack.cardShadowOpacity * 10),
      }}
    >
      {/* Left accent bar */}
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: 4,
          backgroundColor: theme.spineAccent,
          borderTopLeftRadius: 14,
          borderBottomLeftRadius: 14,
        }}
      />
      {/* Subtle grid texture */}
      <View style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <View
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                top: 10 + row * 20,
                left: 60 + col * 30,
                width: 20, height: 14,
                borderRadius: 3,
                borderWidth: 0.5,
                borderColor: theme.spineAccent,
              }}
            />
          ))
        )}
      </View>
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: theme.spineAccent + '22',
          alignItems: 'center', justifyContent: 'center',
          marginLeft: 8, marginRight: 14,
        }}
      >
        <CalendarDays size={20} color={theme.spineAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.muted, marginBottom: 2 }}>
          SCHEDULE
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
          Calendar
        </Text>
        <Text style={{ fontSize: 12, color: theme.muted }}>Today, this week & month</Text>
      </View>
      <CalendarDays size={16} color={theme.spineAccent} style={{ opacity: 0.5 }} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Desk Screen
// ---------------------------------------------------------------------------

export default function DeskScreen() {
  const theme = useTheme();
  const pack = usePackTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const deskSetupComplete = useDeskStore((s) => s.deskSetupComplete);
  const firstLaunchComplete = useDeskStore((s) => s.firstLaunchComplete);
  const hasHydrated = useDeskStore((s) => s.hasHydrated);
  const deskLayout = useDeskStore((s) => s.deskLayout);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!firstLaunchComplete) {
      router.replace('/first-launch');
    } else if (!deskSetupComplete) {
      router.replace('/desk-setup');
    }
  }, [hasHydrated, firstLaunchComplete, deskSetupComplete]);

  const showScanBar = deskLayout !== 'compact';
  const showWideCards = deskLayout === 'expanded';

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <View pointerEvents="none" style={{ position: 'absolute', width: '100%', aspectRatio: 1, top: '50%', left: 0, right: 0, marginTop: '-50%' }}>
        <Image
          source={require('../../../assets/backsplash.png')}
          style={{ width: '100%', height: '100%', opacity: 0.55 }}
          resizeMode="contain"
        />
      </View>
      <View style={{ flex: 1, backgroundColor: 'rgba(8,8,14,0.55)' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 0 }}>
          <View>
            <Text
              style={{
                fontSize: 30,
                fontWeight: '800',
                color: theme.textOnDesk,
                fontFamily: 'serif',
                letterSpacing: -0.5,
              }}
            >
              VibeForge Desk
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.muted,
                marginTop: 2,
                marginBottom: 16,
              }}
            >
              {fmtDay()}
            </Text>
          </View>

          {/* Command bar button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              deferredNavigate('/command-bar');
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: theme.deskHl,
              borderWidth: 0.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
            }}
            hitSlop={6}
          >
            <Command size={18} color={theme.textOnDesk} />
          </Pressable>
        </View>

        {/* Quick Shelf */}
        <View style={{ marginHorizontal: -20, marginBottom: 4 }}>
          <QuickShelf />
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.deskHl,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 12,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              deferredNavigate('/search');
            }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          >
            <Search size={18} color={theme.muted} />
            <Text style={{ fontSize: 15, color: theme.muted, marginLeft: 10, flex: 1 }}>
              Search all items...
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              deferredNavigate('/command-bar');
            }}
            hitSlop={8}
          >
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '600' }}>⌘K</Text>
            </View>
          </Pressable>
        </View>

        {/* Canvas Hero Card — first main content */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.muted,
            marginBottom: 0,
            marginTop: 8,
          }}
        >
          PINBOARD
        </Text>
        <CanvasHeroCard />

        {/* Scan to Desk — kept imperative (Alert callback navigation) */}
        {showScanBar ? (
        <Pressable
          onPress={() => {
            Alert.alert('Scan to Desk', 'Choose a source', [
              {
                text: 'Camera',
                onPress: () =>
                  router.push({ pathname: '/scan-preview', params: { source: 'camera' } }),
              },
              {
                text: 'Photo Library',
                onPress: () =>
                  router.push({ pathname: '/scan-preview', params: { source: 'library' } }),
              },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.brandGreen + '18',
            borderRadius: 12,
            paddingVertical: 14,
            marginBottom: 20,
            marginTop: 16,
            borderWidth: 0.5,
            borderColor: theme.brandGreen + '33',
          }}
        >
          <ScanLine size={18} color={theme.brandGreen} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: theme.brandGreen,
              marginLeft: 8,
            }}
          >
            Scan to Desk
          </Text>
        </Pressable>
        ) : null}

        {/* Today actions */}
        <View style={{ marginBottom: 20, marginTop: showScanBar ? 0 : 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TactileButton
              label="Plan"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deferredNavigate({ pathname: '/tool-list', params: { kind: 'plan' } });
              }}
              flex={1}
              theme={theme}
            />
            <TactileButton
              label="Execute"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deferredNavigate({ pathname: '/tool-list', params: { kind: 'task' } });
              }}
              flex={1}
              theme={theme}
            />
            <TactileButton
              label="Reflect"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deferredNavigate({ pathname: '/tool-list', params: { kind: 'journal' } });
              }}
              flex={1}
              theme={theme}
            />
          </View>
        </View>

        {/* Tool Cards — 2x2 grid */}
        {(() => {
          const tileKinds = KIND_KEYS.filter((k) => KIND_REGISTRY[k].homePlacement === 'tile') as CoreKind[];
          return (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 2,
                  color: theme.muted,
                  marginBottom: 10,
                }}
              >
                TOOLS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP }}>
                {tileKinds.map((k) => (
                  <StackCard
                    key={k}
                    kind={k}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  />
                ))}
              </View>
            </View>
          );
        })()}

        {/* Studio Spotlight */}
        {showWideCards ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            deferredNavigate('/(tabs)/studio');
          }}
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: pack.cardRadius,
            padding: 16,
            marginTop: 18,
            borderWidth: pack.cardBorderWidth,
            borderColor: theme.spineAccent + '55',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: pack.cardShadowOffsetY },
            shadowOpacity: pack.cardShadowOpacity * 0.6,
            shadowRadius: pack.cardShadowRadius,
            elevation: Math.round(pack.cardShadowOpacity * 10),
          }}
        >
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: theme.spineAccent, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
            <View
              style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: theme.spineAccent + '22',
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}
            >
              <Palette size={20} color={theme.spineAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.muted, marginBottom: 2 }}>
                STUDIO
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.textOnDesk, fontFamily: 'serif', marginBottom: 2 }}>
                Studio
              </Text>
              <Text style={{ fontSize: 12, color: theme.muted }}>
                Themes · Packs · Templates
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              {[theme.spineAccent, theme.brandGreen, theme.stickyYellow, theme.plannerGreen].map((color, i) => (
                <View key={i} style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: color, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }} />
              ))}
            </View>
          </View>
        </Pressable>
        ) : null}

        {/* Vault wide card */}
        {showWideCards ? <VaultCard /> : null}

        {/* Journal wide card */}
        {showWideCards ? <JournalCard /> : null}

        {/* Goals wide card */}
        {showWideCards ? <GoalsCard /> : null}

        {/* Calendar wide card */}
        {showWideCards ? <CalendarCard /> : null}

        {/* Activity Timeline button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            deferredNavigate('/activity');
          }}
          onLongPress={() => {
            if (__DEV__) {
              router.push('/theme-qa');
            }
          }}
          delayLongPress={800}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.deskHl,
            borderRadius: 12,
            paddingVertical: 14,
            marginTop: 28,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
        >
          <Clock size={18} color={theme.muted} />
          <Text
            style={{
              fontSize: 15, fontWeight: '600',
              color: theme.textOnDesk, marginLeft: 8,
            }}
          >
            Activity Timeline
          </Text>
        </Pressable>
      </ScrollView>
      </View>
    </View>
  );
}

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  FileText,
  CheckSquare,
  BookOpen,
  Archive,
  Target,
  StickyNote,
  Palette,
  MapPin,
  Clock,
  Layers,
  CalendarDays,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import useDeskStore, { createItem } from '@/lib/state/store';
import type { ShelfItem } from '@/lib/state/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPINE_ACCENT = '#D54B56';
const BG = '#0A0A0F';
const SURFACE = '#13131A';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT_PRIMARY = '#F0F0F5';
const TEXT_MUTED = 'rgba(255,255,255,0.4)';

// ---------------------------------------------------------------------------
// ALL shelf options (mirrors index.tsx)
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

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function shelfIcon(iconName: string, color: string, size: number = 18): React.ReactNode {
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
// Step dots
// ---------------------------------------------------------------------------

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === step ? SPINE_ACCENT : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Layout preset card
// ---------------------------------------------------------------------------

type DeskLayout = 'compact' | 'expanded' | 'focus';

function LayoutPreviewCard({
  layout,
  selected,
  onPress,
}: {
  layout: DeskLayout;
  selected: boolean;
  onPress: () => void;
}) {
  const configs: Record<DeskLayout, { title: string; description: string; rows: Array<{ color: string; height: number; label?: string }> }> = {
    compact: {
      title: 'Compact',
      description: 'Shelf + cards, no scan bar',
      rows: [
        { color: 'rgba(255,255,255,0.12)', height: 8, label: 'SHELF' },
        { color: SPINE_ACCENT + '44', height: 28, label: 'CARDS' },
        { color: SPINE_ACCENT + '44', height: 28 },
      ],
    },
    expanded: {
      title: 'Expanded',
      description: 'Everything visible (default)',
      rows: [
        { color: 'rgba(255,255,255,0.12)', height: 8, label: 'SHELF' },
        { color: '#2A6B3C44', height: 10, label: 'SCAN BAR' },
        { color: SPINE_ACCENT + '44', height: 20, label: 'CARDS' },
        { color: SPINE_ACCENT + '44', height: 20 },
        { color: 'rgba(255,255,255,0.08)', height: 10, label: 'WIDE CARDS' },
        { color: 'rgba(255,255,255,0.08)', height: 10 },
      ],
    },
    focus: {
      title: 'Focus',
      description: 'Tools + today only',
      rows: [
        { color: 'rgba(255,255,255,0.12)', height: 8, label: 'SHELF' },
        { color: SPINE_ACCENT + '44', height: 28, label: 'CARDS' },
        { color: SPINE_ACCENT + '44', height: 28 },
        { color: 'rgba(255,255,255,0.08)', height: 10, label: 'TODAY' },
      ],
    },
  };

  const cfg = configs[layout];

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: selected ? SPINE_ACCENT + '18' : SURFACE,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: selected ? SPINE_ACCENT : BORDER,
        padding: 14,
        minHeight: 160,
      }}
    >
      {/* Mini preview */}
      <View
        style={{
          backgroundColor: '#0A0A0F',
          borderRadius: 8,
          padding: 8,
          gap: 4,
          marginBottom: 12,
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        {cfg.rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                flex: 1,
                height: row.height,
                borderRadius: 3,
                backgroundColor: row.color,
              }}
            />
            {row.label ? (
              <Text style={{ fontSize: 5, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5, width: 28 }}>
                {row.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Title + description */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: selected ? SPINE_ACCENT : TEXT_PRIMARY, flex: 1 }}>
          {cfg.title}
        </Text>
        {selected ? (
          <View
            style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: SPINE_ACCENT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={11} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 15 }}>
        {cfg.description}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main wizard screen
// ---------------------------------------------------------------------------

export default function DeskSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isCustomizeMode = params.mode === 'customize';

  const setShelfItems = useDeskStore((s) => s.setShelfItems);
  const setDeskSetupComplete = useDeskStore((s) => s.setDeskSetupComplete);
  const setDeskLayout = useDeskStore((s) => s.setDeskLayout);
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const addPin = useDeskStore((s) => s.addPin);

  const TOTAL_STEPS = 3;
  const [step, setStep] = useState<number>(0);

  // Post-wizard: show "Create First Pin" prompt (only in empty path)
  const [showFirstPinPrompt, setShowFirstPinPrompt] = useState(false);
  const [firstPinTitle, setFirstPinTitle] = useState('');

  // Step 1: selected tool IDs (default to plan + task + journal + studio)
  const [selectedIds, setSelectedIds] = useState<string[]>(['plan', 'task', 'journal', 'studio']);

  // Step 2: ordered list of selected tools
  const [orderedItems, setOrderedItems] = useState<ShelfItem[]>(() =>
    ALL_SHELF_OPTIONS.filter((o) => ['plan', 'task', 'journal', 'studio'].includes(o.id))
  );

  // Step 3: layout choice
  const [layout, setLayout] = useState<DeskLayout>('expanded');

  // Slide animation
  const translateX = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animateToNext = useCallback(() => {
    translateX.value = SCREEN_WIDTH;
    translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [translateX]);

  const finishSetup = useCallback(() => {
    setShelfItems(orderedItems);
    setDeskLayout(layout);
    setDeskSetupComplete(true);
    if (isCustomizeMode) {
      // Sample path: go straight to desk
      router.replace('/(tabs)');
    } else {
      // Empty path: show first-pin prompt
      setShowFirstPinPrompt(true);
    }
  }, [orderedItems, layout, isCustomizeMode, setShelfItems, setDeskLayout, setDeskSetupComplete, router]);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step === 0) {
      // Sync orderedItems to match current selectedIds (preserve existing order, append new)
      const nextOrdered: ShelfItem[] = [];
      // Keep existing ordered items that are still selected
      for (const item of orderedItems) {
        if (selectedIds.includes(item.id)) nextOrdered.push(item);
      }
      // Append newly selected items not yet in ordered list
      for (const id of selectedIds) {
        if (!nextOrdered.find((x) => x.id === id)) {
          const opt = ALL_SHELF_OPTIONS.find((o) => o.id === id);
          if (opt) nextOrdered.push(opt);
        }
      }
      setOrderedItems(nextOrdered);
      animateToNext();
      setStep(1);
    } else if (step === 1) {
      animateToNext();
      setStep(2);
    } else {
      // Finish
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finishSetup();
    }
  }, [step, selectedIds, orderedItems, layout, animateToNext, finishSetup]);

  const handleCreateFirstPin = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const title = firstPinTitle.trim();
    if (!title) return;

    // Create a plan item for the pin
    const item = createItem('plan');
    item.title = title;
    upsertItem(item);

    // Add it to canvas
    addPin({
      id: item.id + '_pin',
      itemId: item.id,
      x: 40,
      y: 80,
      w: 200,
      h: 130,
      z: 0,
    });

    router.replace('/(tabs)');
  }, [firstPinTitle, upsertItem, addPin, router]);

  // Toggle tool selection
  const toggleTool = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // enforce minimum 1
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }, []);

  // Move item up/down in order list
  const moveItem = useCallback((index: number, direction: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrderedItems((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  }, []);

  const stepTitles = isCustomizeMode
    ? ['Customize Tools', 'Order Your Shelf', 'Choose Layout']
    : ['Choose Your Tools', 'Order Your Shelf', 'Choose Layout'];
  const stepSubtitles = [
    'Select which tools appear on your quick shelf.',
    'Drag items up or down to set the shelf order.',
    'Pick how your desk is arranged by default.',
  ];

  // ---- First Pin Prompt ----
  if (showFirstPinPrompt) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BG }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 20,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, justifyContent: 'center' }}>
            {/* Icon */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: '#50c878' + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#50c878' + '44',
                  marginBottom: 20,
                }}
              >
                <MapPin size={30} color="#50c878" />
              </View>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: TEXT_PRIMARY,
                  letterSpacing: -0.4,
                  textAlign: 'center',
                  fontFamily: 'serif',
                }}
              >
                Create Your First Pin
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: TEXT_MUTED,
                  marginTop: 8,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Give your first canvas item a title.{'\n'}You can add more from the Canvas.
              </Text>
            </View>

            {/* Input */}
            <View
              style={{
                backgroundColor: SURFACE,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#50c878' + '44',
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 14,
              }}
            >
              <TextInput
                value={firstPinTitle}
                onChangeText={setFirstPinTitle}
                placeholder="e.g. My First Board"
                placeholderTextColor={TEXT_MUTED}
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: TEXT_PRIMARY,
                }}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateFirstPin}
              />
            </View>

            {/* Create button */}
            <Pressable
              onPress={handleCreateFirstPin}
              disabled={!firstPinTitle.trim()}
              style={({ pressed }) => ({
                backgroundColor: firstPinTitle.trim() ? '#50c878' : 'rgba(80,200,120,0.3)',
                borderRadius: 14,
                paddingVertical: 17,
                alignItems: 'center',
                marginBottom: 12,
              })}
            >
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#000', letterSpacing: 0.3 }}>
                Add to Canvas
              </Text>
            </Pressable>

            {/* Skip */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/(tabs)');
              }}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 15, color: TEXT_MUTED, fontWeight: '600' }}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: BORDER,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2, color: SPINE_ACCENT, marginBottom: 4 }}>
              DESK SETUP — STEP {step + 1} OF {TOTAL_STEPS}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
              {stepTitles[step]}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 20, marginBottom: 14 }}>
          {stepSubtitles[step]}
        </Text>
        <StepDots step={step} total={TOTAL_STEPS} />
      </View>

      {/* Step content */}
      <Animated.View style={[{ flex: 1 }, slideStyle]}>
        {step === 0 ? (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ALL_SHELF_OPTIONS.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => toggleTool(opt.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isSelected ? SPINE_ACCENT + '22' : SURFACE,
                      borderRadius: 24,
                      paddingHorizontal: 16,
                      paddingVertical: 11,
                      borderWidth: 1.5,
                      borderColor: isSelected ? SPINE_ACCENT : BORDER,
                      gap: 8,
                    }}
                  >
                    {shelfIcon(opt.icon, isSelected ? SPINE_ACCENT : TEXT_MUTED)}
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: isSelected ? TEXT_PRIMARY : TEXT_MUTED,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {isSelected ? (
                      <View
                        style={{
                          width: 16, height: 16, borderRadius: 8,
                          backgroundColor: SPINE_ACCENT,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Check size={10} color="#fff" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 16, textAlign: 'center' }}>
              {selectedIds.length} tool{selectedIds.length !== 1 ? 's' : ''} selected — minimum 1 required
            </Text>
          </ScrollView>
        ) : step === 1 ? (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: 10 }}>
              {orderedItems.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: SURFACE,
                    borderRadius: 14,
                    borderWidth: 0.5,
                    borderColor: BORDER,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    gap: 12,
                  }}
                >
                  {/* Position badge */}
                  <View
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      backgroundColor: SPINE_ACCENT + '22',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: SPINE_ACCENT }}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Icon */}
                  {shelfIcon(item.icon, TEXT_MUTED, 18)}

                  {/* Label */}
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY }}>
                    {item.label}
                  </Text>

                  {/* Up / Down buttons */}
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Pressable
                      onPress={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: index === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <ChevronUp size={16} color={index === 0 ? 'rgba(255,255,255,0.2)' : TEXT_PRIMARY} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveItem(index, 'down')}
                      disabled={index === orderedItems.length - 1}
                      style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: index === orderedItems.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <ChevronDown size={16} color={index === orderedItems.length - 1 ? 'rgba(255,255,255,0.2)' : TEXT_PRIMARY} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 16, textAlign: 'center' }}>
              Use the arrows to set the order items appear on the shelf
            </Text>
          </ScrollView>
        ) : (
          /* Step 3: Layout */
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Row of 3 layout cards */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {(['compact', 'expanded', 'focus'] as DeskLayout[]).map((l) => (
                <LayoutPreviewCard
                  key={l}
                  layout={l}
                  selected={layout === l}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLayout(l);
                  }}
                />
              ))}
            </View>

            {/* Detail description of selected layout */}
            <View
              style={{
                backgroundColor: SURFACE,
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: SPINE_ACCENT + '33',
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: SPINE_ACCENT, marginBottom: 6 }}>
                {layout.toUpperCase()} LAYOUT
              </Text>
              {layout === 'compact' ? (
                <Text style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 21 }}>
                  Shows just your shelf shortcuts and the four main stack cards. Clean, minimal, distraction-free. Best for power users who know where everything is.
                </Text>
              ) : layout === 'expanded' ? (
                <Text style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 21 }}>
                  Full desk view with all sections: scan bar, shelf, stack cards, studio, canvas, vault, journal, goals, and calendar. Everything at a glance.
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 21 }}>
                  Shows only your shelf tools, the four stack cards, and the Today action buttons. Hides wide cards like Journal, Goals, and Calendar for a focused working session.
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 14, textAlign: 'center' }}>
              You can change this anytime in Settings under Desk Setup
            </Text>
          </ScrollView>
        )}
      </Animated.View>

      {/* Bottom action bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 0.5,
          borderTopColor: BORDER,
          gap: 12,
        }}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#B83E48' : SPINE_ACCENT,
            borderRadius: 14,
            paddingVertical: 17,
            alignItems: 'center',
            opacity: step === 0 && selectedIds.length === 0 ? 0.4 : 1,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
            {step === TOTAL_STEPS - 1
              ? (isCustomizeMode ? 'Apply & Go to Desk' : 'Finish Setup')
              : 'Continue'}
          </Text>
        </Pressable>

        {step > 0 ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep((s) => s - 1);
            }}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 15, color: TEXT_MUTED, fontWeight: '600' }}>Back</Text>
          </Pressable>
        ) : isCustomizeMode ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/(tabs)');
            }}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 15, color: TEXT_MUTED, fontWeight: '600' }}>Skip customization</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

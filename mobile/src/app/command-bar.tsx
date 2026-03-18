import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  FileText,
  CheckSquare,
  BookOpen,
  Archive,
  Target,
  Palette,
  MapPin,
  Zap,
  StickyNote,
  Clock,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { createItem } from '@/lib/state/store';
import type { VFItem } from '@/lib/state/store';
import type { ItemKind } from '@/lib/constants';
import { KINDS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

// ---------------------------------------------------------------------------
// Kind icon helper
// ---------------------------------------------------------------------------

function kindIcon(kind: ItemKind, color: string, size: number = 14): React.ReactNode {
  switch (kind) {
    case 'plan': return <FileText size={size} color={color} />;
    case 'task': return <CheckSquare size={size} color={color} />;
    case 'sticky': return <StickyNote size={size} color={color} />;
    case 'note': return <BookOpen size={size} color={color} />;
    case 'journal': return <BookOpen size={size} color={color} />;
    case 'goal': return <Target size={size} color={color} />;
    case 'vault': return <Archive size={size} color={color} />;
  }
}

function kindColor(kind: ItemKind, theme: ReturnType<typeof useTheme>): string {
  switch (kind) {
    case 'plan': return theme.spineAccent;
    case 'task': return theme.plannerGreen;
    case 'sticky': return theme.stickyYellow;
    case 'note': return theme.ruleBlue;
    case 'journal': return theme.spineAccent;
    case 'goal': return theme.brandGreen;
    case 'vault': return theme.muted;
  }
}

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

function ResultRow({
  item,
  onPress,
}: {
  item: VFItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = kindColor(item.kind, theme);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            marginBottom: 6,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.1)',
          },
        ]}
      >
        {/* Kind badge */}
        <View
          style={{
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: color + '25',
            marginRight: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {kindIcon(item.kind, color)}
          <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.5 }}>
            {KINDS[item.kind].deskLabel}
          </Text>
        </View>
        <Text style={{ flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '500' }} numberOfLines={1}>
          {item.title || '(untitled)'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Quick action row
// ---------------------------------------------------------------------------

function ActionRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: 12,
            marginBottom: 6,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          {icon}
        </View>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
          {label}
        </Text>
        <Zap size={12} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' } as any} />
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Command Bar Screen
// ---------------------------------------------------------------------------

export default function CommandBarScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VFItem[]>([]);
  const inputRef = useRef<TextInput>(null);

  const searchItems = useDeskStore((s) => s.searchItems);
  const upsertItem = useDeskStore((s) => s.upsertItem);

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(60);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 200 });
    sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    sheetOpacity.value = withTiming(1, { duration: 250 });

    // Auto-focus input
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, [overlayOpacity, sheetTranslateY, sheetOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
    opacity: sheetOpacity.value,
  }));

  const dismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 150 });
    sheetOpacity.value = withTiming(0, { duration: 150 });
    sheetTranslateY.value = withTiming(40, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(router.back)();
      }
    });
  }, [overlayOpacity, sheetOpacity, sheetTranslateY, router]);

  // Search as user types
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const found = searchItems(query);
    setResults(found.slice(0, 6));
  }, [query, searchItems]);

  const createAndOpen = useCallback((kind: ItemKind) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item = createItem(kind);
    upsertItem(item);
    dismiss();
    setTimeout(() => {
      router.push({ pathname: '/editor', params: { itemId: item.id, isNew: '1' } });
    }, 200);
  }, [upsertItem, dismiss, router]);

  const openResult = useCallback((item: VFItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismiss();
    setTimeout(() => {
      router.push({ pathname: '/editor', params: { itemId: item.id } });
    }, 200);
  }, [dismiss, router]);

  const navigate = useCallback((path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismiss();
    setTimeout(() => {
      router.push(path as any);
    }, 200);
  }, [dismiss, router]);

  const quickActions: QuickAction[] = [
    {
      id: 'new-note',
      label: 'New Note',
      icon: <BookOpen size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('note'),
    },
    {
      id: 'new-plan',
      label: 'New Plan',
      icon: <FileText size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('plan'),
    },
    {
      id: 'new-task',
      label: 'New Task Log',
      icon: <CheckSquare size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('task'),
    },
    {
      id: 'new-sticky',
      label: 'New Sticky',
      icon: <StickyNote size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('sticky'),
    },
    {
      id: 'new-journal',
      label: 'New Journal Entry',
      icon: <BookOpen size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('journal'),
    },
    {
      id: 'new-goal',
      label: 'New Goal',
      icon: <Target size={15} color="rgba(255,255,255,0.7)" />,
      action: () => createAndOpen('goal'),
    },
    {
      id: 'canvas',
      label: 'Open Canvas',
      icon: <MapPin size={15} color="rgba(255,255,255,0.7)" />,
      action: () => navigate('/canvas'),
    },
    {
      id: 'studio',
      label: 'Open Studio',
      icon: <Palette size={15} color="rgba(255,255,255,0.7)" />,
      action: () => navigate('/(tabs)/studio'),
    },
    {
      id: 'themes',
      label: 'Switch Theme',
      icon: <Palette size={15} color="rgba(255,255,255,0.7)" />,
      action: () => navigate('/themes'),
    },
    {
      id: 'export',
      label: 'Export Vault',
      icon: <Archive size={15} color="rgba(255,255,255,0.7)" />,
      action: () => navigate('/export-panel'),
    },
    {
      id: 'activity',
      label: 'Activity Timeline',
      icon: <Clock size={15} color="rgba(255,255,255,0.7)" />,
      action: () => navigate('/activity'),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Backdrop */}
      <Animated.View
        style={[
          overlayStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            sheetStyle,
            {
              backgroundColor: '#18181B',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.12)',
              maxHeight: '85%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 20,
            },
          ]}
        >
          {/* Handle */}
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              marginTop: 10,
              marginBottom: 2,
            }}
          />

          {/* Search row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search or type a command... (⌘K)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                flex: 1,
                fontSize: 16,
                color: '#FFFFFF',
                marginLeft: 10,
                marginRight: 8,
              }}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <Pressable onPress={dismiss} hitSlop={10}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Search results */}
            {results.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 1.5,
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: 8,
                    paddingHorizontal: 4,
                  }}
                >
                  RESULTS
                </Text>
                {results.map((item) => (
                  <ResultRow
                    key={item.id}
                    item={item}
                    onPress={() => openResult(item)}
                  />
                ))}
              </View>
            ) : null}

            {/* Quick actions */}
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 1.5,
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                QUICK ACTIONS
              </Text>
              {quickActions.map((action) => (
                <ActionRow
                  key={action.id}
                  label={action.label}
                  icon={action.icon}
                  onPress={action.action}
                />
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

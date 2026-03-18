import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Lock } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import { KINDS } from '@/lib/constants';
import type { VFItem, PinboardPin } from '@/lib/state/store';
import { MIN_CARD_W, MIN_CARD_H, kindDotColor, type DrawTool } from './types';
import ResizeHandle from './ResizeHandle';
import ContextMenu from './ContextMenu';

interface DraggablePinCardProps {
  pin: PinboardPin;
  item: VFItem;
  isSelected: boolean;
  activeTool: DrawTool;
  viewportScale: SharedValue<number>;
  onSelect: (id: string, addToSelection?: boolean) => void;
  onUpdatePin: (id: string, updates: Partial<PinboardPin>) => void;
  onRemovePin: (id: string) => void;
  onDuplicatePin: (pin: PinboardPin) => void;
}

export default function DraggablePinCard({
  pin,
  item,
  isSelected,
  activeTool,
  viewportScale,
  onSelect,
  onUpdatePin,
  onRemovePin,
  onDuplicatePin,
}: DraggablePinCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const translateX = useSharedValue(pin.x);
  const translateY = useSharedValue(pin.y);
  const offsetX = useSharedValue(pin.x);
  const offsetY = useSharedValue(pin.y);
  const cardScale = useSharedValue(1);
  const totalMovement = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = pin.x;
    translateY.value = pin.y;
  }, [pin.x, pin.y, translateX, translateY]);

  const persistPosition = useCallback(
    (x: number, y: number) => {
      onUpdatePin(pin.id, { x, y });
    },
    [pin.id, onUpdatePin],
  );

  const openItem = useCallback(() => {
    router.push({ pathname: '/editor', params: { itemId: item.id } });
  }, [router, item.id]);

  const handleSelect = useCallback((addToSelection: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(pin.id, addToSelection);
  }, [pin.id, onSelect]);

  const handleDelete = useCallback(() => {
    onRemovePin(pin.id);
  }, [pin.id, onRemovePin]);

  const handleForward = useCallback(() => {
    onUpdatePin(pin.id, { z: Math.min(pin.z + 1, 200) });
  }, [pin.id, pin.z, onUpdatePin]);

  const handleBackward = useCallback(() => {
    onUpdatePin(pin.id, { z: Math.max(pin.z - 1, 0) });
  }, [pin.id, pin.z, onUpdatePin]);

  const handleDuplicate = useCallback(() => {
    onDuplicatePin(pin);
  }, [pin, onDuplicatePin]);

  const handleToggleLock = useCallback(() => {
    onUpdatePin(pin.id, { locked: !pin.locked });
  }, [pin.id, pin.locked, onUpdatePin]);

  const handleResize = useCallback(
    (_id: string, updates: { x?: number; y?: number; w: number; h: number }) => {
      onUpdatePin(pin.id, updates);
    },
    [pin.id, onUpdatePin],
  );

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .minDistance(10)
    .enabled(!pin.locked && activeTool === 'pan')
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
      totalMovement.value = 0;
      cardScale.value = withSpring(1.06, { damping: 15, stiffness: 300 });
    })
    .onUpdate((e) => {
      translateX.value = offsetX.value + e.translationX / viewportScale.value;
      translateY.value = offsetY.value + e.translationY / viewportScale.value;
      totalMovement.value = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);
    })
    .onEnd(() => {
      cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      runOnJS(persistPosition)(translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(500)
    .enabled(activeTool === 'pan')
    .onEnd(() => {
      runOnJS(openItem)();
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(handleSelect)(true);
    });

  const composed = Gesture.Race(
    longPressGesture,
    panGesture,
    tapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: cardScale.value },
    ],
    zIndex: pin.z,
  }));

  const dotColor = kindDotColor(item.kind, theme);
  const meta = KINDS[item.kind];
  const cardW = Math.max(pin.w, MIN_CARD_W);
  const cardH = Math.max(pin.h, MIN_CARD_H);

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute' }]}>
      <Pressable
        onPress={handleDelete}
        hitSlop={10}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: 'rgba(255,60,60,0.85)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <Trash2 size={13} color="#fff" />
      </Pressable>

      {pin.locked ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            padding: 3,
            zIndex: 20,
          }}
          pointerEvents="none"
        >
          <Lock size={10} color="#FFCC00" />
        </View>
      ) : null}

      <GestureDetector gesture={composed}>
        <Animated.View
          style={{
            width: cardW,
            minHeight: cardH,
            backgroundColor: theme.deskHl,
            borderRadius: 12,
            padding: 12,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? '#007AFF' : theme.spineAccent + '80',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.55,
            shadowRadius: 14,
            elevation: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
                marginRight: 6,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1,
                color: theme.muted,
                textTransform: 'uppercase',
              }}
            >
              {meta?.deskLabel ?? item.kind}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={{ fontSize: 14, fontWeight: '700', color: theme.textOnDesk }}
          >
            {item.title || '(untitled)'}
          </Text>

          {isSelected ? (
            <>
              {!pin.locked ? (
                <>
                  <ResizeHandle
                    corner="tl"
                    itemId={pin.id}
                    itemX={pin.x}
                    itemY={pin.y}
                    itemW={cardW}
                    itemH={cardH}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="tr"
                    itemId={pin.id}
                    itemX={pin.x}
                    itemY={pin.y}
                    itemW={cardW}
                    itemH={cardH}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="br"
                    itemId={pin.id}
                    itemX={pin.x}
                    itemY={pin.y}
                    itemW={cardW}
                    itemH={cardH}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="bl"
                    itemId={pin.id}
                    itemX={pin.x}
                    itemY={pin.y}
                    itemW={cardW}
                    itemH={cardH}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                </>
              ) : null}
              <ContextMenu
                x={0}
                y={0}
                onForward={handleForward}
                onBackward={handleBackward}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggleLock={handleToggleLock}
                locked={pin.locked}
              />
            </>
          ) : null}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

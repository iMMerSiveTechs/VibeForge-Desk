import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ImageIcon, Lock } from 'lucide-react-native';
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
import type { PinboardElement } from '@/lib/state/store';
import type { DrawTool } from './types';
import ResizeHandle from './ResizeHandle';
import ContextMenu from './ContextMenu';
import TextEditModal from './TextEditModal';

interface DraggableElementProps {
  element: PinboardElement;
  isSelected: boolean;
  activeTool: DrawTool;
  viewportScale: SharedValue<number>;
  onSelect: (id: string, addToSelection?: boolean) => void;
  onDeselect: () => void;
  onUpdateElement: (id: string, updates: Partial<PinboardElement>) => void;
  onRemoveElement: (id: string) => void;
  onDuplicateElement: (element: PinboardElement) => void;
}

export default function DraggableElement({
  element,
  isSelected,
  activeTool,
  viewportScale,
  onSelect,
  onUpdateElement,
  onRemoveElement,
  onDuplicateElement,
}: DraggableElementProps) {
  const theme = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const translateX = useSharedValue(element.x);
  const translateY = useSharedValue(element.y);
  const offsetX = useSharedValue(element.x);
  const offsetY = useSharedValue(element.y);
  const dragScale = useSharedValue(1);

  React.useEffect(() => {
    translateX.value = element.x;
    translateY.value = element.y;
  }, [element.x, element.y, translateX, translateY]);

  const persistPos = useCallback(
    (x: number, y: number) => {
      onUpdateElement(element.id, { x, y });
    },
    [element.id, onUpdateElement],
  );

  const handleSelect = useCallback((addToSelection: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(element.id, addToSelection);
  }, [element.id, onSelect]);

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(!element.locked && activeTool === 'pan')
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
      dragScale.value = withSpring(1.05, { damping: 15, stiffness: 300 });
    })
    .onUpdate((e) => {
      translateX.value = offsetX.value + e.translationX / viewportScale.value;
      translateY.value = offsetY.value + e.translationY / viewportScale.value;
    })
    .onEnd(() => {
      dragScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      runOnJS(persistPos)(translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap()
    .enabled(activeTool === 'pan')
    .onEnd(() => {
      runOnJS(handleSelect)(false);
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(handleSelect)(true);
    });

  const composed = Gesture.Simultaneous(panGesture, longPressGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: dragScale.value },
    ],
    zIndex: element.z,
  }));

  const handleResize = useCallback(
    (id: string, updates: { x?: number; y?: number; w: number; h: number }) => {
      onUpdateElement(id, updates);
    },
    [onUpdateElement],
  );

  const handleDelete = useCallback(() => {
    onRemoveElement(element.id);
  }, [element.id, onRemoveElement]);

  const handleForward = useCallback(() => {
    onUpdateElement(element.id, { z: Math.min(element.z + 1, 200) });
  }, [element.id, element.z, onUpdateElement]);

  const handleBackward = useCallback(() => {
    onUpdateElement(element.id, { z: Math.max(element.z - 1, 0) });
  }, [element.id, element.z, onUpdateElement]);

  const handleDuplicate = useCallback(() => {
    onDuplicateElement(element);
  }, [element, onDuplicateElement]);

  const handleToggleLock = useCallback(() => {
    onUpdateElement(element.id, { locked: !element.locked });
  }, [element.id, element.locked, onUpdateElement]);

  const handleSaveText = useCallback(
    (text: string) => {
      onUpdateElement(element.id, { data: { ...element.data, text } });
    },
    [element.id, element.data, onUpdateElement],
  );

  const renderContent = () => {
    switch (element.type) {
      case 'sticky':
        return (
          <Pressable
            onLongPress={() => setEditModalVisible(true)}
            style={{
              width: element.w,
              height: element.h,
              backgroundColor: '#FFEC5C',
              borderRadius: 4,
              padding: 10,
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <Text
              style={{ fontSize: 13, color: '#1a1a1a', fontWeight: '500', flexShrink: 1 }}
              numberOfLines={6}
            >
              {element.data?.text || 'Tap to edit...'}
            </Text>
            {isSelected ? (
              <Text
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 6,
                  fontSize: 9,
                  color: 'rgba(0,0,0,0.35)',
                }}
              >
                hold to edit
              </Text>
            ) : null}
          </Pressable>
        );

      case 'text':
        return (
          <Pressable
            onLongPress={() => setEditModalVisible(true)}
            style={{
              width: element.w,
              height: element.h,
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{ fontSize: 15, color: theme.textOnDesk, fontWeight: '500' }}
              numberOfLines={3}
            >
              {element.data?.text || 'Text block'}
            </Text>
          </Pressable>
        );

      case 'image':
        return element.data?.uri ? (
          <Image
            source={{ uri: element.data.uri }}
            style={{
              width: element.w,
              height: element.h,
              borderRadius: 8,
              backgroundColor: theme.deskHl,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: element.w,
              height: element.h,
              backgroundColor: theme.deskHl,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <ImageIcon size={32} color={theme.muted} />
          </View>
        );

      case 'shape':
        return (
          <View
            style={{
              width: element.w,
              height: element.h,
              backgroundColor: element.data?.color ?? '#007AFF',
              borderRadius: element.data?.variant === 'circle' ? element.w / 2 : 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
        );

      case 'arrow':
        return (
          <View
            style={{
              width: Math.max(element.w, 20),
              height: Math.max(element.h, 20),
              backgroundColor: 'transparent',
            }}
          />
        );

      default:
        return null;
    }
  };

  const editTitle =
    element.type === 'sticky' ? 'Edit Sticky Note' : 'Edit Text Block';

  return (
    <>
      <GestureDetector gesture={composed}>
        <Animated.View style={[animatedStyle, { position: 'absolute' }]}>
          {renderContent()}
          {element.locked ? (
            <View
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 8,
                padding: 3,
              }}
              pointerEvents="none"
            >
              <Lock size={10} color="#FFCC00" />
            </View>
          ) : null}
          {isSelected ? (
            <>
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderWidth: 2,
                  borderColor: '#007AFF',
                  borderRadius: element.type === 'shape' && element.data?.variant === 'circle'
                    ? element.w / 2
                    : 10,
                  pointerEvents: 'none',
                }}
              />
              {!element.locked && element.type !== 'arrow' ? (
                <>
                  <ResizeHandle
                    corner="tl"
                    itemId={element.id}
                    itemX={element.x}
                    itemY={element.y}
                    itemW={element.w}
                    itemH={element.h}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="tr"
                    itemId={element.id}
                    itemX={element.x}
                    itemY={element.y}
                    itemW={element.w}
                    itemH={element.h}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="br"
                    itemId={element.id}
                    itemX={element.x}
                    itemY={element.y}
                    itemW={element.w}
                    itemH={element.h}
                    viewportScale={viewportScale}
                    onResize={handleResize}
                  />
                  <ResizeHandle
                    corner="bl"
                    itemId={element.id}
                    itemX={element.x}
                    itemY={element.y}
                    itemW={element.w}
                    itemH={element.h}
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
                locked={element.locked}
              />
            </>
          ) : null}
        </Animated.View>
      </GestureDetector>

      {(element.type === 'sticky' || element.type === 'text') ? (
        <TextEditModal
          visible={editModalVisible}
          initialText={element.data?.text ?? ''}
          title={editTitle}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveText}
        />
      ) : null}
    </>
  );
}

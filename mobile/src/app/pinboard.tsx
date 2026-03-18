import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Trash2,
  MapPin,
  StickyNote,
  Type,
  ImageIcon,
  Square,
  Circle,
  Share2,
  ChevronUp,
  ChevronDown,
  Copy,
  Lock,
  Unlock,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { uid } from '@/lib/state/store';
import { KINDS } from '@/lib/constants';
import type { VFItem, PinboardPin, PinboardElement, PinboardStroke } from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';
import InkLayer, { SkiaDotGrid } from '@/components/pinboard/InkLayer';
import PinboardToolbar, { type DrawTool } from '@/components/pinboard/PinboardToolbar';
import { safeClose } from '@/lib/safeClose';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_CARD_W = 140;
const MIN_CARD_H = 90;
const CANVAS_SIZE = 4000;

// Safe mode: disables unstable add-palette options until fully implemented
const PINBOARD_SAFE_MODE = true;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

function kindDotColor(kind: string, theme: ReturnType<typeof useTheme>): string {
  switch (kind) {
    case 'plan':
      return theme.coverPrimary;
    case 'task':
      return theme.plannerGreen;
    case 'sticky':
      return theme.stickyYellow;
    case 'note':
      return theme.ruleBlue;
    default:
      return theme.muted;
  }
}

// ---------------------------------------------------------------------------
// TextEditModal
// ---------------------------------------------------------------------------

interface TextEditModalProps {
  visible: boolean;
  initialText: string;
  title: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

function TextEditModal({ visible, initialText, title, onClose, onSave }: TextEditModalProps) {
  const theme = useTheme();
  const [text, setText] = useState(initialText);

  const handleSave = useCallback(() => {
    onSave(text);
    onClose();
  }, [text, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: theme.desk,
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 380,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: theme.textOnDesk,
              marginBottom: 14,
            }}
          >
            {title}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            style={{
              backgroundColor: theme.deskHl,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: theme.textOnDesk,
              minHeight: 100,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: theme.deskHl,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.muted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: theme.brandGreen,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ItemPickerModal
// ---------------------------------------------------------------------------

function ItemPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: VFItem) => void;
}) {
  const theme = useTheme();
  const itemsById = useDeskStore((s) => s.itemsById);

  const availableItems = useMemo(() => {
    return Object.values(itemsById).filter((i) => !i.archived);
  }, [itemsById]);

  const renderItem = ({ item }: { item: VFItem }) => {
    const dotColor = kindDotColor(item.kind, theme);
    const meta = KINDS[item.kind];
    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: theme.textOnDesk }}
          >
            {item.title || '(untitled)'}
          </Text>
          <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {meta?.label ?? item.kind}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View
          style={{
            backgroundColor: theme.desk,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: SCREEN_HEIGHT * 0.6,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.muted,
                opacity: 0.4,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.textOnDesk,
              textAlign: 'center',
              paddingBottom: 12,
            }}
          >
            Select Item to Pin
          </Text>
          {availableItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: theme.muted }}>
                No items available. Create some items first.
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableItems}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Element Palette Modal
// ---------------------------------------------------------------------------

interface PaletteOption {
  label: string;
  color: string;
  onPress: () => void;
  icon: React.ReactNode;
}

function ElementPaletteModal({
  visible,
  onClose,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  options: PaletteOption[];
}) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View
          style={{
            backgroundColor: theme.desk,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.muted,
                opacity: 0.4,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.textOnDesk,
              textAlign: 'center',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            Add Element
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 16,
              gap: 10,
            }}
          >
            {options.map((opt) => (
              <Pressable
                key={opt.label}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
                style={{
                  width: (SCREEN_WIDTH - 52) / 3,
                  paddingVertical: 16,
                  borderRadius: 14,
                  backgroundColor: theme.deskHl,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: opt.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  {opt.icon}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.textOnDesk,
                    textAlign: 'center',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Context Menu (for selected items)
// ---------------------------------------------------------------------------

interface ContextMenuProps {
  x: number;
  y: number;
  onForward: () => void;
  onBackward: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  locked?: boolean;
}

function ContextMenu({
  x,
  y,
  onForward,
  onBackward,
  onDelete,
  onDuplicate,
  onToggleLock,
  locked,
}: ContextMenuProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y - 44,
        flexDirection: 'row',
        backgroundColor: theme.desk,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 20,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onForward}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronUp size={14} color={theme.textOnDesk} />
        <Text style={{ fontSize: 12, color: theme.textOnDesk, fontWeight: '600' }}>Fwd</Text>
      </Pressable>
      <View style={{ width: 1, backgroundColor: theme.border }} />
      <Pressable
        onPress={onBackward}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronDown size={14} color={theme.textOnDesk} />
        <Text style={{ fontSize: 12, color: theme.textOnDesk, fontWeight: '600' }}>Back</Text>
      </Pressable>
      {onDuplicate ? (
        <>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <Pressable
            onPress={onDuplicate}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Copy size={14} color={theme.textOnDesk} />
          </Pressable>
        </>
      ) : null}
      {onToggleLock ? (
        <>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <Pressable
            onPress={onToggleLock}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            {locked ? (
              <Unlock size={14} color="#FFCC00" />
            ) : (
              <Lock size={14} color={theme.textOnDesk} />
            )}
          </Pressable>
        </>
      ) : null}
      <View style={{ width: 1, backgroundColor: theme.border }} />
      <Pressable
        onPress={onDelete}
        style={{ paddingHorizontal: 12, paddingVertical: 10 }}
      >
        <Text style={{ fontSize: 12, color: '#FF4444', fontWeight: '700' }}>Delete</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Resize Handles
// ---------------------------------------------------------------------------

type ResizeCorner = 'tl' | 'tr' | 'br' | 'bl';

interface ResizeHandleProps {
  corner: ResizeCorner;
  itemId: string;
  itemX: number;
  itemY: number;
  itemW: number;
  itemH: number;
  viewportScale: SharedValue<number>;
  onResize: (id: string, updates: { x?: number; y?: number; w: number; h: number }) => void;
}

function ResizeHandle({
  corner,
  itemId,
  itemX,
  itemY,
  itemW,
  itemH,
  viewportScale,
  onResize,
}: ResizeHandleProps) {
  const startW = useSharedValue(itemW);
  const startH = useSharedValue(itemH);
  const startX = useSharedValue(itemX);
  const startY = useSharedValue(itemY);

  const handleResize = useCallback(
    (newX: number, newY: number, newW: number, newH: number) => {
      const updates: { x?: number; y?: number; w: number; h: number } = {
        w: Math.max(80, newW),
        h: Math.max(60, newH),
      };
      if (corner === 'tl' || corner === 'bl') updates.x = newX;
      if (corner === 'tl' || corner === 'tr') updates.y = newY;
      onResize(itemId, updates);
    },
    [corner, itemId, onResize],
  );

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      startW.value = itemW;
      startH.value = itemH;
      startX.value = itemX;
      startY.value = itemY;
    })
    .onUpdate((e) => {
      const scale = viewportScale.value;
      const dx = e.translationX / scale;
      const dy = e.translationY / scale;
      let newW = startW.value;
      let newH = startH.value;
      let newX = startX.value;
      let newY = startY.value;

      switch (corner) {
        case 'tl':
          newW = startW.value - dx;
          newH = startH.value - dy;
          newX = startX.value + dx;
          newY = startY.value + dy;
          break;
        case 'tr':
          newW = startW.value + dx;
          newH = startH.value - dy;
          newY = startY.value + dy;
          break;
        case 'br':
          newW = startW.value + dx;
          newH = startH.value + dy;
          break;
        case 'bl':
          newW = startW.value - dx;
          newH = startH.value + dy;
          newX = startX.value + dx;
          break;
      }
      runOnJS(handleResize)(newX, newY, newW, newH);
    });

  const cornerOffset: Record<ResizeCorner, { top?: number; bottom?: number; left?: number; right?: number }> = {
    tl: { top: -6, left: -6 },
    tr: { top: -6, right: -6 },
    br: { bottom: -6, right: -6 },
    bl: { bottom: -6, left: -6 },
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: '#007AFF',
          zIndex: 100,
          ...cornerOffset[corner],
        }}
      />
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Draggable Element (sticky, text, image, shape, arrow)
// ---------------------------------------------------------------------------

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

function DraggableElement({
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

  // Keep shared values in sync when element updates from store
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
        // Arrow is rendered in InkLayer; this is just the hit area
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
          {/* Lock icon overlay */}
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
              {/* Selection border */}
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
              {/* In safe mode: no resize handles, no floating context menu */}
              {!PINBOARD_SAFE_MODE ? (
                <>
              {/* Resize handles — not shown for locked or arrow */}
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
              {/* Context menu */}
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
            </>
          ) : null}
        </Animated.View>
      </GestureDetector>

      {/* Text edit modal */}
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

// ---------------------------------------------------------------------------
// Draggable Pin Card
// ---------------------------------------------------------------------------

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

function DraggablePinCard({
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
      {/* Delete button — outside GestureDetector so it doesn't block card taps */}
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

      {/* Lock icon */}
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
        {/* Kind badge */}
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

        {/* Title */}
        <Text
          numberOfLines={2}
          style={{ fontSize: 14, fontWeight: '700', color: theme.textOnDesk }}
        >
          {item.title || '(untitled)'}
        </Text>

        {/* Selection: resize handles + context menu */}
        {isSelected ? (
          <>
            {!PINBOARD_SAFE_MODE && !pin.locked ? (
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
            {PINBOARD_SAFE_MODE ? null : (
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
            )}
          </>
        ) : null}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Active stroke type (in-progress drawing)
// ---------------------------------------------------------------------------

interface ActiveStrokeState {
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

// ---------------------------------------------------------------------------
// Pinboard Screen
// ---------------------------------------------------------------------------

export default function PinboardScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Store selectors
  const pins = useDeskStore((s) => s.pinboard.pins);
  const elements = useDeskStore((s) => s.pinboard.elements);
  const storedViewport = useDeskStore((s) => s.pinboard.viewport);
  const itemsById = useDeskStore((s) => s.itemsById);
  const strokes = useDeskStore((s) => s.pinboard.strokes);
  const canUndo = useDeskStore((s) => s.pinboard.undoStack.length > 0);
  const canRedo = useDeskStore((s) => s.pinboard.redoStack.length > 0);
  const addPin = useDeskStore((s) => s.addPin);
  const updatePin = useDeskStore((s) => s.updatePin);
  const removePin = useDeskStore((s) => s.removePin);
  const addElement = useDeskStore((s) => s.addElement);
  const updateElement = useDeskStore((s) => s.updateElement);
  const removeElement = useDeskStore((s) => s.removeElement);
  const setViewport = useDeskStore((s) => s.setViewport);
  const addStroke = useDeskStore((s) => s.addStroke);
  const undoInk = useDeskStore((s) => s.undoInk);
  const redoInk = useDeskStore((s) => s.redoInk);
  const clearInk = useDeskStore((s) => s.clearInk);

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [paletteVisible, setPaletteVisible] = useState(false);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawTool>(PINBOARD_SAFE_MODE ? 'pen' : 'pan');
  const [activeDrawStroke, setActiveDrawStroke] = useState<ActiveStrokeState | null>(null);

  // Arrow creation ref
  const arrowStartRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas ref for export
  const canvasRef = useRef<View>(null);

  // Viewport shared values — initialized from stored viewport
  const viewportScale = useSharedValue(storedViewport.scale);
  const viewportX = useSharedValue(storedViewport.offsetX);
  const viewportY = useSharedValue(storedViewport.offsetY);

  // Pinch gesture base values
  const basePinchScale = useSharedValue(storedViewport.scale);
  const basePanX = useSharedValue(storedViewport.offsetX);
  const basePanY = useSharedValue(storedViewport.offsetY);

  const saveViewport = useCallback(
    (scale: number, offsetX: number, offsetY: number) => {
      setViewport({ scale, offsetX, offsetY });
    },
    [setViewport],
  );

  // Selection helpers
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectItem = useCallback(
    (id: string, addToSelection?: boolean) => {
      if (addToSelection) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        setSelectedIds(new Set([id]));
      }
    },
    [],
  );

  // Update active draw stroke (called from JS thread via runOnJS)
  const updateActiveStroke = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      if (activeTool === 'pan' || activeTool === 'arrow') return;
      const color = activeTool === 'highlighter' ? '#FFEC5C' : '#FFFFFF';
      const width = activeTool === 'highlighter' ? 16 : 3;
      setActiveDrawStroke({ tool: activeTool as 'pen' | 'highlighter', color, width, points: [...points] });
    },
    [activeTool],
  );

  const commitActiveStroke = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      setActiveDrawStroke(null);
      if (points.length < 2) return;
      const color = activeTool === 'highlighter' ? '#FFEC5C' : '#FFFFFF';
      const width = activeTool === 'highlighter' ? 16 : 3;
      const stroke: PinboardStroke = {
        id: uid(),
        tool: activeTool as 'pen' | 'highlighter',
        color,
        width,
        points,
        createdAt: new Date().toISOString(),
      };
      addStroke(stroke);
    },
    [activeTool, addStroke],
  );

  const commitArrow = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      const minX = Math.min(startX, endX);
      const minY = Math.min(startY, endY);
      const w = Math.max(Math.abs(endX - startX), 20);
      const h = Math.max(Math.abs(endY - startY), 20);
      const allZ = [...pins.map((p) => p.z), ...elements.map((e) => e.z)];
      const maxZ = allZ.length > 0 ? Math.max(...allZ) : 0;
      const arrow: PinboardElement = {
        id: uid(),
        type: 'arrow',
        x: minX,
        y: minY,
        w,
        h,
        z: maxZ + 1,
        data: {
          startX,
          startY,
          endX,
          endY,
          color: '#fff',
          strokeWidth: 2,
          arrowStyle: 'straight',
        },
      };
      addElement(arrow);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [pins, elements, addElement],
  );

  // Canvas pan (2 fingers) — disabled when drawing or in safe mode
  const canvasPan = Gesture.Pan()
    .minPointers(2)
    .enabled(!PINBOARD_SAFE_MODE && activeTool === 'pan')
    .onStart(() => {
      basePanX.value = viewportX.value;
      basePanY.value = viewportY.value;
    })
    .onUpdate((e) => {
      viewportX.value = basePanX.value + e.translationX;
      viewportY.value = basePanY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(saveViewport)(viewportScale.value, viewportX.value, viewportY.value);
    });

  // Canvas pinch — disabled when drawing or in safe mode
  const canvasPinch = Gesture.Pinch()
    .enabled(!PINBOARD_SAFE_MODE && activeTool === 'pan')
    .onStart(() => {
      basePinchScale.value = viewportScale.value;
    })
    .onUpdate((e) => {
      viewportScale.value = clamp(basePinchScale.value * e.scale, 0.3, 3.0);
    })
    .onEnd(() => {
      runOnJS(saveViewport)(viewportScale.value, viewportX.value, viewportY.value);
    });

  // Tap on empty canvas area to deselect — only fires when tapping the background, not cards
  const canvasTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(clearSelection)();
    });

  // Accumulate points in a shared value array for thread-safe drawing
  const drawPointsX = useSharedValue<number[]>([]);
  const drawPointsY = useSharedValue<number[]>([]);

  // Drawing gesture — single finger pan when tool is pen or highlighter
  const drawingGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(activeTool === 'pen' || activeTool === 'highlighter')
    .onStart((e) => {
      'worklet';
      const canvasX = (e.x - viewportX.value) / viewportScale.value;
      const canvasY = (e.y - viewportY.value) / viewportScale.value;
      drawPointsX.value = [canvasX];
      drawPointsY.value = [canvasY];
      runOnJS(updateActiveStroke)([{ x: canvasX, y: canvasY }]);
    })
    .onUpdate((e) => {
      'worklet';
      const canvasX = (e.x - viewportX.value) / viewportScale.value;
      const canvasY = (e.y - viewportY.value) / viewportScale.value;
      drawPointsX.value = [...drawPointsX.value, canvasX];
      drawPointsY.value = [...drawPointsY.value, canvasY];
      const pts = drawPointsX.value.map((x, i) => ({ x, y: drawPointsY.value[i] }));
      runOnJS(updateActiveStroke)(pts);
    })
    .onEnd(() => {
      'worklet';
      const pts = drawPointsX.value.map((x, i) => ({ x, y: drawPointsY.value[i] }));
      drawPointsX.value = [];
      drawPointsY.value = [];
      runOnJS(commitActiveStroke)(pts);
    });

  // Arrow gesture — single finger, records start/end; disabled in safe mode
  const arrowGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(!PINBOARD_SAFE_MODE && activeTool === 'arrow')
    .onStart((e) => {
      'worklet';
      const canvasX = (e.x - viewportX.value) / viewportScale.value;
      const canvasY = (e.y - viewportY.value) / viewportScale.value;
      runOnJS((x: number, y: number) => {
        arrowStartRef.current = { x, y };
      })(canvasX, canvasY);
    })
    .onEnd((e) => {
      'worklet';
      const endX = (e.x - viewportX.value) / viewportScale.value;
      const endY = (e.y - viewportY.value) / viewportScale.value;
      runOnJS((ex: number, ey: number) => {
        if (arrowStartRef.current) {
          const { x: sx, y: sy } = arrowStartRef.current;
          commitArrow(sx, sy, ex, ey);
          arrowStartRef.current = null;
        }
      })(endX, endY);
    });

  const activeDrawingGesture = (!PINBOARD_SAFE_MODE && activeTool === 'arrow') ? arrowGesture : drawingGesture;


  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: viewportX.value },
      { translateY: viewportY.value },
      { scale: viewportScale.value },
    ],
  }));

  // Compute placement center in canvas-space
  const getCanvasCenter = useCallback(
    (elW: number, elH: number) => {
      const x = -viewportX.value / viewportScale.value + SCREEN_WIDTH / 2 / viewportScale.value - elW / 2;
      const y = -viewportY.value / viewportScale.value + (SCREEN_HEIGHT * 0.5) / viewportScale.value - elH / 2;
      return { x, y };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const getMaxZ = useCallback(() => {
    const allZ = [...pins.map((p) => p.z), ...elements.map((e) => e.z)];
    return allZ.length > 0 ? Math.max(...allZ) : 0;
  }, [pins, elements]);

  // Element creation helpers
  const addStickyNote = useCallback(() => {
    const { x, y } = getCanvasCenter(150, 120);
    const el: PinboardElement = {
      id: uid(),
      type: 'sticky',
      x,
      y,
      w: 150,
      h: 120,
      z: getMaxZ() + 1,
      data: { text: 'New sticky note' },
    };
    addElement(el);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [getCanvasCenter, getMaxZ, addElement]);

  const addTextBlock = useCallback(() => {
    const { x, y } = getCanvasCenter(180, 60);
    const el: PinboardElement = {
      id: uid(),
      type: 'text',
      x,
      y,
      w: 180,
      h: 60,
      z: getMaxZ() + 1,
      data: { text: 'Text block' },
    };
    addElement(el);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [getCanvasCenter, getMaxZ, addElement]);

  const addImageElement = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to photos to add images to the board.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const { x, y } = getCanvasCenter(160, 120);
        const el: PinboardElement = {
          id: uid(),
          type: 'image',
          x,
          y,
          w: 160,
          h: 120,
          z: getMaxZ() + 1,
          data: { uri },
        };
        addElement(el);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Image Error', 'Unable to add image right now.');
    }
  }, [getCanvasCenter, getMaxZ, addElement]);

  const addShape = useCallback(
    (variant: 'rect' | 'circle') => {
      const w = variant === 'circle' ? 100 : 120;
      const h = variant === 'circle' ? 100 : 80;
      const { x, y } = getCanvasCenter(w, h);
      const el: PinboardElement = {
        id: uid(),
        type: 'shape',
        x,
        y,
        w,
        h,
        z: getMaxZ() + 1,
        data: { variant, color: '#007AFF' },
      };
      addElement(el);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [getCanvasCenter, getMaxZ, addElement],
  );

  const handleItemPickerSelect = useCallback(
    (item: VFItem) => {
      const { x, y } = getCanvasCenter(MIN_CARD_W, MIN_CARD_H);
      const newPin: PinboardPin = {
        id: uid(),
        itemId: item.id,
        x,
        y,
        w: MIN_CARD_W,
        h: MIN_CARD_H,
        z: getMaxZ() + 1,
      };
      addPin(newPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickerVisible(false);
    },
    [getCanvasCenter, getMaxZ, addPin],
  );

  // Duplicate helpers
  const handleDuplicateElement = useCallback(
    (el: PinboardElement) => {
      const newEl: PinboardElement = {
        ...el,
        id: uid(),
        x: el.x + 20,
        y: el.y + 20,
        z: getMaxZ() + 1,
      };
      addElement(newEl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [getMaxZ, addElement],
  );

  const handleDuplicatePin = useCallback(
    (pin: PinboardPin) => {
      const newPin: PinboardPin = {
        ...pin,
        id: uid(),
        x: pin.x + 20,
        y: pin.y + 20,
        z: getMaxZ() + 1,
      };
      addPin(newPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [getMaxZ, addPin],
  );

  // Export
  const handleExport = useCallback(async () => {
    try {
      // Safety: cap export to screen-size viewport to avoid OOM on large canvases
      const exportWidth = Math.min(SCREEN_WIDTH * 2, 2048);
      const exportHeight = Math.min(SCREEN_HEIGHT * 2, 2048);
      if (exportWidth > 2048 || exportHeight > 2048) {
        Alert.alert('Export Warning', 'Canvas is very large; export may be reduced in quality.');
      }
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 0.85,
        width: exportWidth,
        height: exportHeight,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Pinboard',
        });
      } else {
        Alert.alert('Saved', 'Screenshot saved. Use your device to share from Photos.');
      }
    } catch {
      Alert.alert('Export', 'Take a screenshot using your device, then share from Photos app.');
    }
  }, []);

  const validPins = useMemo(
    () => pins.filter((p) => itemsById[p.itemId] != null),
    [pins, itemsById],
  );

  const safeElements = useMemo(() => elements ?? [], [elements]);

  const arrowElements = useMemo(
    () => safeElements.filter((el): el is PinboardElement & { type: 'arrow' } => el.type === 'arrow'),
    [safeElements],
  );

  const isEmpty = validPins.length === 0 && safeElements.length === 0;

  const paletteOptions: PaletteOption[] = PINBOARD_SAFE_MODE ? [
    {
      label: 'Pin Item',
      color: theme.coverPrimary,
      icon: <MapPin size={22} color={theme.coverPrimary} />,
      onPress: () => setPickerVisible(true),
    },
  ] : [
    {
      label: 'Sticky Note',
      color: '#FFEC5C',
      icon: <StickyNote size={22} color="#b8860b" />,
      onPress: addStickyNote,
    },
    {
      label: 'Text Block',
      color: theme.ruleBlue,
      icon: <Type size={22} color={theme.ruleBlue} />,
      onPress: addTextBlock,
    },
    {
      label: 'Pin Item',
      color: theme.coverPrimary,
      icon: <MapPin size={22} color={theme.coverPrimary} />,
      onPress: () => setPickerVisible(true),
    },
    {
      label: 'Image',
      color: theme.brandGreen,
      icon: <ImageIcon size={22} color={theme.brandGreen} />,
      onPress: addImageElement,
    },
    {
      label: 'Rectangle',
      color: '#007AFF',
      icon: <Square size={22} color="#007AFF" />,
      onPress: () => addShape('rect'),
    },
    {
      label: 'Circle',
      color: '#FF6B6B',
      icon: <Circle size={22} color="#FF6B6B" />,
      onPress: () => addShape('circle'),
    },
  ];

  // Header right actions
  const headerRight = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable
        onPress={handleExport}
        hitSlop={8}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.deskHl,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Share2 size={18} color={theme.textOnDesk} />
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader
        title="Pinboard"
        onBack={() => safeClose(router)}
        rightActions={headerRight}
      />

      {/* Canvas area */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* Background layer: handles pinch/pan/tap-to-deselect. Cards are NOT inside this GestureDetector. */}
        <GestureDetector gesture={PINBOARD_SAFE_MODE ? Gesture.Race(activeDrawingGesture, canvasTap) : (activeTool === 'pan' ? Gesture.Simultaneous(canvasPinch, canvasPan, canvasTap) : activeDrawingGesture)}>
          <Animated.View
            ref={canvasRef as React.Ref<Animated.View>}
            style={[
              canvasAnimatedStyle,
              {
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                backgroundColor: theme.desk,
              },
            ]}
            pointerEvents="box-only"
          >
            {/* Skia Dot grid background */}
            <SkiaDotGrid width={CANVAS_SIZE} height={CANVAS_SIZE} />

            {/* Ink layer — behind all pins/elements, also renders arrows */}
            <InkLayer
              strokes={strokes}
              activeStroke={activeDrawStroke}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              arrows={arrowElements}
            />

            {/* Empty state (inside canvas at center) */}
            {isEmpty ? (
              <View
                style={{
                  position: 'absolute',
                  top: CANVAS_SIZE / 2 - 60,
                  left: CANVAS_SIZE / 2 - 120,
                  width: 240,
                  alignItems: 'center',
                }}
              >
                <MapPin size={36} color={theme.muted} style={{ opacity: 0.3 }} />
                <Text
                  style={{
                    fontSize: 15,
                    color: theme.muted,
                    marginTop: 10,
                    opacity: 0.5,
                    textAlign: 'center',
                  }}
                >
                  Tap "+" to add items to the board
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {/* Cards layer: sits on top of the background, transforms with viewport, has its own gestures */}
        <Animated.View
          style={[
            canvasAnimatedStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Pin cards */}
          {validPins.map((pin) => {
            const item = itemsById[pin.itemId];
            if (!item) return null;
            return (
              <DraggablePinCard
                key={pin.id}
                pin={pin}
                item={item}
                isSelected={selectedIds.has(pin.id)}
                activeTool={activeTool}
                viewportScale={viewportScale}
                onSelect={handleSelectItem}
                onUpdatePin={updatePin}
                onRemovePin={removePin}
                onDuplicatePin={handleDuplicatePin}
              />
            );
          })}

          {/* Elements */}
          {safeElements.map((el) => (
            <DraggableElement
              key={el.id}
              element={el}
              isSelected={selectedIds.has(el.id)}
              activeTool={activeTool}
              viewportScale={viewportScale}
              onSelect={handleSelectItem}
              onDeselect={() => setSelectedIds(new Set())}
              onUpdateElement={updateElement}
              onRemoveElement={removeElement}
              onDuplicateElement={handleDuplicateElement}
            />
          ))}
        </Animated.View>
      </View>

      {/* Toolbar — fixed overlay, outside canvas */}
      <PinboardToolbar
        activeTool={activeTool}
        onChangeTool={setActiveTool}
        safeMode={PINBOARD_SAFE_MODE}
        onUndo={undoInk}
        onRedo={redoInk}
        onClear={clearInk}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* FAB — fixed overlay, outside canvas */}
      <Pressable
        onPress={() => setPaletteVisible(true)}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: theme.brandGreen,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 12,
          zIndex: 100,
        }}
      >
        <Plus size={28} color="#fff" />
      </Pressable>

      {/* Modals */}
      <ElementPaletteModal
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        options={paletteOptions}
      />

      <ItemPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleItemPickerSelect}
      />
    </View>
  );
}

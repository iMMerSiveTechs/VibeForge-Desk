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
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  MapPin,
  StickyNote,
  Type,
  ImageIcon,
  Square,
  Circle,
  Share2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { uid } from '@/lib/state/store';
import type { VFItem, PinboardPin, PinboardElement, PinboardStroke } from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';
import InkLayer, { SkiaDotGrid } from '@/components/canvas/InkLayer';
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import DraggableElement from '@/components/canvas/DraggableElement';
import DraggablePinCard from '@/components/canvas/DraggablePinCard';
import ElementPalette from '@/components/canvas/ElementPalette';
import ItemPickerModal from '@/components/canvas/ItemPickerModal';
import ColorPicker from '@/components/canvas/ColorPicker';
import StrokeWidthSelector from '@/components/canvas/StrokeWidthSelector';
import Minimap from '@/components/canvas/Minimap';
import AlignmentGuides from '@/components/canvas/AlignmentGuides';
import { GridSnapToggle, snapToGrid } from '@/components/canvas/GridSnap';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MIN_CARD_W,
  MIN_CARD_H,
  CANVAS_SIZE,
  clamp,
  type DrawTool,
  type ActiveStrokeState,
  type PaletteOption,
} from '@/components/canvas/types';
import { safeClose } from '@/lib/safeClose';

// ---------------------------------------------------------------------------
// Canvas Screen
// ---------------------------------------------------------------------------

export default function CanvasScreen() {
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

  // Drawing state — pan mode enabled by default (SAFE_MODE removed)
  const [activeTool, setActiveTool] = useState<DrawTool>('pan');
  const [activeDrawStroke, setActiveDrawStroke] = useState<ActiveStrokeState | null>(null);

  // Color & stroke width state
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  // Grid snap state
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);

  // Currently dragging element (for alignment guides)
  const [draggingElement, setDraggingElement] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Arrow creation ref
  const arrowStartRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas ref for export
  const canvasRef = useRef<View>(null);

  // Viewport shared values
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

  // Drawing callbacks — use dynamic color/width from state
  const updateActiveStroke = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      if (activeTool === 'pan' || activeTool === 'arrow' || activeTool === 'eraser') return;
      const color = activeTool === 'highlighter' ? '#FFEC5C' : strokeColor;
      const width = activeTool === 'highlighter' ? strokeWidth * 4 : strokeWidth;
      setActiveDrawStroke({ tool: activeTool as 'pen' | 'highlighter', color, width, points: [...points] });
    },
    [activeTool, strokeColor, strokeWidth],
  );

  const commitActiveStroke = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      setActiveDrawStroke(null);
      if (points.length < 2) return;
      const color = activeTool === 'highlighter' ? '#FFEC5C' : strokeColor;
      const width = activeTool === 'highlighter' ? strokeWidth * 4 : strokeWidth;
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
    [activeTool, addStroke, strokeColor, strokeWidth],
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

  // Eraser: remove strokes that intersect with the eraser path
  const handleErase = useCallback(
    (points: Array<{ x: number; y: number }>) => {
      if (points.length < 2) return;
      // Simple eraser: find strokes whose any point is within 20px of any eraser point
      const eraserRadius = 20;
      const currentStrokes = useDeskStore.getState().pinboard.strokes;
      const toRemove = new Set<string>();

      for (const stroke of currentStrokes) {
        for (const sp of stroke.points) {
          let found = false;
          for (const ep of points) {
            const dx = sp.x - ep.x;
            const dy = sp.y - ep.y;
            if (dx * dx + dy * dy < eraserRadius * eraserRadius) {
              toRemove.add(stroke.id);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      if (toRemove.size > 0) {
        const remaining = currentStrokes.filter((s) => !toRemove.has(s.id));
        // Use store's internal mechanism: push to undo stack then set strokes
        const state = useDeskStore.getState();
        const nextUndoStack = [...state.pinboard.undoStack, state.pinboard.strokes];
        if (nextUndoStack.length > 75) nextUndoStack.splice(0, nextUndoStack.length - 75);
        useDeskStore.setState({
          pinboard: {
            ...state.pinboard,
            strokes: remaining,
            undoStack: nextUndoStack,
            redoStack: [],
          },
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [],
  );

  // Canvas pan (2 fingers)
  const canvasPan = Gesture.Pan()
    .minPointers(2)
    .enabled(activeTool === 'pan')
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

  // Canvas pinch
  const canvasPinch = Gesture.Pinch()
    .enabled(activeTool === 'pan')
    .onStart(() => {
      basePinchScale.value = viewportScale.value;
    })
    .onUpdate((e) => {
      viewportScale.value = clamp(basePinchScale.value * e.scale, 0.3, 3.0);
    })
    .onEnd(() => {
      runOnJS(saveViewport)(viewportScale.value, viewportX.value, viewportY.value);
    });

  // Tap on empty canvas to deselect
  const canvasTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(clearSelection)();
    });

  // Drawing shared value arrays
  const drawPointsX = useSharedValue<number[]>([]);
  const drawPointsY = useSharedValue<number[]>([]);

  // Drawing gesture — single finger when tool is pen/highlighter
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

  // Eraser gesture — single finger, collects points then erases matching strokes
  const eraserGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(activeTool === 'eraser')
    .onStart((e) => {
      'worklet';
      const canvasX = (e.x - viewportX.value) / viewportScale.value;
      const canvasY = (e.y - viewportY.value) / viewportScale.value;
      drawPointsX.value = [canvasX];
      drawPointsY.value = [canvasY];
    })
    .onUpdate((e) => {
      'worklet';
      const canvasX = (e.x - viewportX.value) / viewportScale.value;
      const canvasY = (e.y - viewportY.value) / viewportScale.value;
      drawPointsX.value = [...drawPointsX.value, canvasX];
      drawPointsY.value = [...drawPointsY.value, canvasY];
    })
    .onEnd(() => {
      'worklet';
      const pts = drawPointsX.value.map((x, i) => ({ x, y: drawPointsY.value[i] }));
      drawPointsX.value = [];
      drawPointsY.value = [];
      runOnJS(handleErase)(pts);
    });

  // Arrow gesture
  const arrowGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .enabled(activeTool === 'arrow')
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

  // Choose active gesture based on tool
  const getActiveGesture = () => {
    switch (activeTool) {
      case 'arrow':
        return arrowGesture;
      case 'eraser':
        return eraserGesture;
      case 'pen':
      case 'highlighter':
        return drawingGesture;
      default:
        return drawingGesture;
    }
  };

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
      x, y,
      w: 150, h: 120,
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
      x, y,
      w: 180, h: 60,
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
        Alert.alert('Permission needed', 'Allow access to photos to add images to the canvas.');
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
          x, y,
          w: 160, h: 120,
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
        x, y,
        w, h,
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
        x, y,
        w: MIN_CARD_W, h: MIN_CARD_H,
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
      const exportWidth = Math.min(SCREEN_WIDTH * 2, 2048);
      const exportHeight = Math.min(SCREEN_HEIGHT * 2, 2048);
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
          dialogTitle: 'Share Canvas',
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

  // Sort all items by z-order for proper rendering
  const sortedItems = useMemo(() => {
    const allItems: Array<{ type: 'pin'; pin: typeof validPins[0]; z: number } | { type: 'element'; element: PinboardElement; z: number }> = [];
    for (const pin of validPins) {
      allItems.push({ type: 'pin', pin, z: pin.z });
    }
    for (const el of safeElements) {
      if (el.type !== 'arrow') {
        allItems.push({ type: 'element', element: el, z: el.z });
      }
    }
    allItems.sort((a, b) => a.z - b.z);
    return allItems;
  }, [validPins, safeElements]);

  const isEmpty = validPins.length === 0 && safeElements.length === 0;

  // Minimap navigation
  const handleMinimapNavigate = useCallback(
    (x: number, y: number) => {
      viewportX.value = x;
      viewportY.value = y;
      saveViewport(viewportScale.value, x, y);
    },
    [viewportX, viewportY, viewportScale, saveViewport],
  );

  // Alignment guide data for other elements
  const otherElementRects = useMemo(() => {
    const rects: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
    for (const pin of validPins) {
      rects.push({ id: pin.id, x: pin.x, y: pin.y, w: pin.w, h: pin.h });
    }
    for (const el of safeElements) {
      if (el.type !== 'arrow') {
        rects.push({ id: el.id, x: el.x, y: el.y, w: el.w, h: el.h });
      }
    }
    return rects;
  }, [validPins, safeElements]);

  // Show drawing tools UI when pen/highlighter/arrow active
  const showDrawingTools = activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'arrow';

  const paletteOptions: PaletteOption[] = [
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
        title="Canvas"
        onBack={() => safeClose(router)}
        rightActions={headerRight}
      />

      {/* Canvas area */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {/* Background layer */}
        <GestureDetector
          gesture={
            activeTool === 'pan'
              ? Gesture.Simultaneous(canvasPinch, canvasPan, canvasTap)
              : getActiveGesture()
          }
        >
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
            <SkiaDotGrid width={CANVAS_SIZE} height={CANVAS_SIZE} />
            <InkLayer
              strokes={strokes}
              activeStroke={activeDrawStroke}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              arrows={arrowElements}
            />
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
                  Tap "+" to add items to the canvas
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        {/* Cards/Elements layer — sorted by z-order for correct stacking */}
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
          {sortedItems.map((item) => {
            if (item.type === 'pin') {
              const pinItem = itemsById[item.pin.itemId];
              if (!pinItem) return null;
              return (
                <DraggablePinCard
                  key={item.pin.id}
                  pin={item.pin}
                  item={pinItem}
                  isSelected={selectedIds.has(item.pin.id)}
                  activeTool={activeTool}
                  viewportScale={viewportScale}
                  onSelect={handleSelectItem}
                  onUpdatePin={updatePin}
                  onRemovePin={removePin}
                  onDuplicatePin={handleDuplicatePin}
                />
              );
            } else {
              return (
                <DraggableElement
                  key={item.element.id}
                  element={item.element}
                  isSelected={selectedIds.has(item.element.id)}
                  activeTool={activeTool}
                  viewportScale={viewportScale}
                  onSelect={handleSelectItem}
                  onDeselect={() => setSelectedIds(new Set())}
                  onUpdateElement={updateElement}
                  onRemoveElement={removeElement}
                  onDuplicateElement={handleDuplicateElement}
                />
              );
            }
          })}
        </Animated.View>
      </View>

      {/* Alignment Guides overlay (inside canvas area) */}
      <AlignmentGuides
        activeElement={draggingElement}
        otherElements={otherElementRects}
      />

      {/* Minimap */}
      <Minimap
        pins={validPins.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h }))}
        elements={safeElements.filter((e) => e.type !== 'arrow').map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h, type: e.type }))}
        viewportX={viewportX.value}
        viewportY={viewportY.value}
        viewportScale={viewportScale.value}
        canvasSize={CANVAS_SIZE}
        screenWidth={SCREEN_WIDTH}
        screenHeight={SCREEN_HEIGHT}
        onNavigate={handleMinimapNavigate}
      />

      {/* Grid Snap Toggle */}
      <View style={{ position: 'absolute', top: 100, right: 12, zIndex: 200 }}>
        <GridSnapToggle enabled={gridSnapEnabled} onToggle={setGridSnapEnabled} />
      </View>

      {/* Color Picker (visible when drawing tools active) */}
      <View style={{ position: 'absolute', top: 52, left: 12, right: 12, zIndex: 300 }}>
        <ColorPicker
          selectedColor={strokeColor}
          onSelect={setStrokeColor}
          visible={showDrawingTools && showColorPicker}
        />
      </View>

      {/* Stroke Width Selector */}
      <View style={{ position: 'absolute', top: 100, left: 12, zIndex: 300 }}>
        <StrokeWidthSelector
          selectedWidth={strokeWidth}
          onSelect={setStrokeWidth}
          visible={showDrawingTools && showWidthPicker}
        />
      </View>

      {/* Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        onChangeTool={(tool) => {
          setActiveTool(tool);
          // Auto-show color/width pickers when switching to drawing tools
          if (tool === 'pen' || tool === 'highlighter' || tool === 'arrow') {
            setShowColorPicker(true);
            setShowWidthPicker(true);
          } else {
            setShowColorPicker(false);
            setShowWidthPicker(false);
          }
        }}
        onUndo={undoInk}
        onRedo={redoInk}
        onClear={clearInk}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* FAB */}
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
      <ElementPalette
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

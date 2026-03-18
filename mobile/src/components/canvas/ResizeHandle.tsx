import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { ResizeCorner } from './types';

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

export default function ResizeHandle({
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

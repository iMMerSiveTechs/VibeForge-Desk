import React, { useCallback, useMemo } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Maximize2 } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MinimapProps {
  pins: Array<{ x: number; y: number; w: number; h: number }>;
  elements: Array<{ x: number; y: number; w: number; h: number; type: string }>;
  viewportX: number;
  viewportY: number;
  viewportScale: number;
  canvasSize: number;
  screenWidth: number;
  screenHeight: number;
  onNavigate: (x: number, y: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MINIMAP_W = 120;
const MINIMAP_H = 80;
const MINIMAP_PADDING = 4;

const ELEMENT_COLORS: Record<string, string> = {
  sticky: '#FFEC5C',
  text: '#FFFFFF',
  image: '#4CAF50',
  shape: '#007AFF',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getElementColor(type: string, brandGreen: string): string {
  if (type === 'pin') return brandGreen;
  return ELEMENT_COLORS[type] ?? '#AAAAAA';
}

function getElementSize(type: string): number {
  if (type === 'pin') return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Minimap = React.memo(function Minimap({
  pins,
  elements,
  viewportX,
  viewportY,
  viewportScale,
  canvasSize,
  screenWidth,
  screenHeight,
  onNavigate,
}: MinimapProps) {
  const theme = useTheme();

  // Scale factor: canvas coords -> minimap coords
  const scale = useMemo(() => MINIMAP_W / canvasSize, [canvasSize]);

  // Viewport rectangle in minimap coordinates
  const viewRect = useMemo(() => {
    const vw = (screenWidth / viewportScale) * scale;
    const vh = (screenHeight / viewportScale) * scale;
    const vx = (-viewportX / viewportScale) * scale;
    const vy = (-viewportY / viewportScale) * scale;
    return {
      left: Math.max(0, Math.min(vx, MINIMAP_W - vw)),
      top: Math.max(0, Math.min(vy, MINIMAP_H - vh)),
      width: Math.min(vw, MINIMAP_W),
      height: Math.min(vh, MINIMAP_H),
    };
  }, [viewportX, viewportY, viewportScale, screenWidth, screenHeight, scale]);

  // Handle tap-to-navigate
  const handlePress = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;
      // Convert minimap tap position to canvas coordinates, centering the viewport
      const canvasX = locationX / scale;
      const canvasY = locationY / scale;
      // Navigate so the tapped point is centered in the viewport
      const newX = -(canvasX - screenWidth / (2 * viewportScale)) * viewportScale;
      const newY = -(canvasY - screenHeight / (2 * viewportScale)) * viewportScale;
      onNavigate(newX, newY);
    },
    [scale, screenWidth, screenHeight, viewportScale, onNavigate],
  );

  // Fit All: calculate bounding box of all items and navigate to show them
  const handleFitAll = useCallback(() => {
    const allItems = [
      ...pins.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
      ...elements.map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h })),
    ];

    if (allItems.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const item of allItems) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.w);
      maxY = Math.max(maxY, item.y + item.h);
    }

    // Add some padding around the bounding box
    const padding = 60;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const boundsW = maxX - minX;
    const boundsH = maxY - minY;

    // Calculate scale to fit all elements
    const fitScale = Math.min(screenWidth / boundsW, screenHeight / boundsH);

    // Center the bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newX = -(centerX - screenWidth / (2 * fitScale)) * fitScale;
    const newY = -(centerY - screenHeight / (2 * fitScale)) * fitScale;

    onNavigate(newX, newY);
  }, [pins, elements, screenWidth, screenHeight, onNavigate]);

  // Pre-compute minimap dots for pins
  const pinDots = useMemo(
    () =>
      pins.map((pin, i) => ({
        key: `pin-${i}`,
        left: pin.x * scale,
        top: pin.y * scale,
        size: 2,
        color: theme.brandGreen,
      })),
    [pins, scale, theme.brandGreen],
  );

  // Pre-compute minimap dots for elements
  const elementDots = useMemo(
    () =>
      elements.map((el, i) => ({
        key: `el-${i}`,
        left: el.x * scale,
        top: el.y * scale,
        size: getElementSize(el.type),
        color: getElementColor(el.type, theme.brandGreen),
      })),
    [elements, scale, theme.brandGreen],
  );

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 170,
        left: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 6,
        zIndex: 190,
      }}
    >
      {/* Minimap */}
      <Pressable onPress={handlePress}>
        <View
          style={{
            width: MINIMAP_W,
            height: MINIMAP_H,
            borderRadius: 8,
            backgroundColor: 'rgba(10, 10, 18, 0.82)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.10)',
            overflow: 'hidden',
            padding: MINIMAP_PADDING,
          }}
        >
          {/* Element dots */}
          {pinDots.map((dot) => (
            <View
              key={dot.key}
              style={{
                position: 'absolute',
                left: MINIMAP_PADDING + dot.left,
                top: MINIMAP_PADDING + dot.top,
                width: dot.size,
                height: dot.size,
                borderRadius: dot.size / 2,
                backgroundColor: dot.color,
              }}
            />
          ))}
          {elementDots.map((dot) => (
            <View
              key={dot.key}
              style={{
                position: 'absolute',
                left: MINIMAP_PADDING + dot.left,
                top: MINIMAP_PADDING + dot.top,
                width: dot.size,
                height: dot.size,
                borderRadius: 1,
                backgroundColor: dot.color,
              }}
            />
          ))}

          {/* Viewport rectangle */}
          <View
            style={{
              position: 'absolute',
              left: MINIMAP_PADDING + viewRect.left,
              top: MINIMAP_PADDING + viewRect.top,
              width: Math.max(viewRect.width, 4),
              height: Math.max(viewRect.height, 4),
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.70)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
            }}
          />
        </View>
      </Pressable>

      {/* Fit All button */}
      <Pressable
        onPress={handleFitAll}
        style={({ pressed }) => ({
          width: 28,
          height: 28,
          borderRadius: 7,
          backgroundColor: pressed
            ? 'rgba(255, 255, 255, 0.18)'
            : 'rgba(10, 10, 18, 0.82)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.10)',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Maximize2 size={13} color="rgba(255, 255, 255, 0.65)" />
      </Pressable>
    </View>
  );
});

export default Minimap;

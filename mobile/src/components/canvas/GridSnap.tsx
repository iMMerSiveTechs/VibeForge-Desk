import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Grid3x3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_GRID_SIZE = 20; // half of dot-grid spacing (40px)

// ---------------------------------------------------------------------------
// Pure snap function
// ---------------------------------------------------------------------------

/**
 * Snaps x,y coordinates to the nearest grid intersection.
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize: number = DEFAULT_GRID_SIZE,
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

// ---------------------------------------------------------------------------
// Toggle Component
// ---------------------------------------------------------------------------

interface GridSnapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function GridSnapToggle({ enabled, onToggle }: GridSnapToggleProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(!enabled);
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 14,
          backgroundColor: enabled
            ? 'rgba(0, 122, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: enabled
            ? 'rgba(0, 122, 255, 0.5)'
            : 'rgba(255, 255, 255, 0.12)',
          gap: 5,
        }}
      >
        <Grid3x3
          size={14}
          color={enabled ? '#007AFF' : 'rgba(255, 255, 255, 0.4)'}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: enabled ? '#007AFF' : 'rgba(255, 255, 255, 0.4)',
            letterSpacing: 0.2,
          }}
        >
          Snap
        </Text>
      </View>
    </Pressable>
  );
}

export default GridSnapToggle;

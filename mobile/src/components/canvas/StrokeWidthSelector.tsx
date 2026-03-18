import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PRESET_WIDTHS = [1, 2, 4, 8, 16] as const;
const MIN_DOT = 6;
const MAX_DOT = 22;

interface StrokeWidthSelectorProps {
  selectedWidth: number;
  onSelect: (width: number) => void;
  visible: boolean;
}

function dotSize(width: number): number {
  // Map stroke width 1..16 to visual dot size MIN_DOT..MAX_DOT
  const t = (width - 1) / (16 - 1);
  return MIN_DOT + t * (MAX_DOT - MIN_DOT);
}

export default function StrokeWidthSelector({
  selectedWidth,
  onSelect,
  visible,
}: StrokeWidthSelectorProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(visible ? 1 : 0, {
      damping: 18,
      stiffness: 260,
      mass: 0.8,
    });
  }, [visible, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const handleSelect = (width: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(width);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(20,20,28,0.92)',
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 16,
        },
        animatedStyle,
      ]}
    >
      {PRESET_WIDTHS.map((width) => {
        const isActive = selectedWidth === width;
        const size = dotSize(width);
        const hitArea = 36;

        return (
          <Pressable
            key={width}
            onPress={() => handleSelect(width)}
            style={{
              width: hitArea,
              height: hitArea,
              borderRadius: hitArea / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isActive
                ? 'rgba(255,255,255,0.15)'
                : 'transparent',
              borderWidth: isActive ? 1.5 : 0,
              borderColor: isActive
                ? 'rgba(255,255,255,0.4)'
                : 'transparent',
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isActive
                  ? '#FFFFFF'
                  : 'rgba(255,255,255,0.5)',
              }}
            />
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

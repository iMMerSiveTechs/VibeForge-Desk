import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// TactileCard: Press-in scales to 0.985, press-out scales to 1.0
// Adds subtle shadow + a top-left hairline highlight edge (skeuo depth)
export function TactileCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[animStyle, style]}>
        {/* Top-left hairline highlight for 2.5D depth */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            borderTopLeftRadius: (style as any)?.borderRadius ?? 12,
            borderTopRightRadius: (style as any)?.borderRadius ?? 12,
            backgroundColor: 'rgba(255,255,255,0.18)',
            zIndex: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 1,
            borderTopLeftRadius: (style as any)?.borderRadius ?? 12,
            borderBottomLeftRadius: (style as any)?.borderRadius ?? 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            zIndex: 1,
          }}
        />
        {children}
      </Animated.View>
    </Pressable>
  );
}

// TactileButton: compact pill-shaped button with press animation
export function TactileButton({
  label,
  onPress,
  flex,
  theme,
}: {
  label: string;
  onPress: () => void;
  flex?: number;
  theme: any;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            backgroundColor: theme.deskHl,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Top hairline highlight */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: theme.textOnDesk,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

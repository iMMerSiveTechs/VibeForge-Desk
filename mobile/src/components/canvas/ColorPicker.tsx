import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Palette } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

const PRESET_COLORS = [
  '#FFFFFF',
  '#FF4444',
  '#FF8C00',
  '#FFEC5C',
  '#4CAF50',
  '#007AFF',
  '#9C27B0',
  '#FF69B4',
  '#000000',
];

const CIRCLE_SIZE = 28;
const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  visible: boolean;
}

export default function ColorPicker({
  selectedColor,
  onSelect,
  visible,
}: ColorPickerProps) {
  const theme = useTheme();
  const [customModalVisible, setCustomModalVisible] = useState<boolean>(false);
  const [hexInput, setHexInput] = useState<string>('');

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

  const handleSelect = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(color);
  };

  const handleCustomSubmit = () => {
    const value = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (HEX_REGEX.test(value)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(value.toUpperCase());
      setCustomModalVisible(false);
      setHexInput('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(20,20,28,0.92)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 8,
            gap: 6,
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
        {PRESET_COLORS.map((color) => {
          const isActive =
            selectedColor.toUpperCase() === color.toUpperCase();
          const isWhite = color === '#FFFFFF';
          const isBlack = color === '#000000';

          return (
            <Pressable
              key={color}
              onPress={() => handleSelect(color)}
              style={{
                width: CIRCLE_SIZE + (isActive ? 4 : 0),
                height: CIRCLE_SIZE + (isActive ? 4 : 0),
                borderRadius: (CIRCLE_SIZE + 4) / 2,
                backgroundColor: color,
                borderWidth: isActive ? 2.5 : isWhite ? 1 : 0,
                borderColor: isActive
                  ? '#FFFFFF'
                  : isWhite
                    ? 'rgba(255,255,255,0.3)'
                    : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isActive ? color : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isActive ? 0.6 : 0,
                shadowRadius: isActive ? 6 : 0,
              }}
            >
              {isActive && isBlack ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: 22,
            backgroundColor: 'rgba(255,255,255,0.15)',
            marginHorizontal: 2,
          }}
        />

        {/* Custom color button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setHexInput(selectedColor);
            setCustomModalVisible(true);
          }}
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Palette size={14} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </Animated.View>

      {/* Custom hex input modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <Pressable
          onPress={() => setCustomModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => {
              /* prevent dismiss */
            }}
            style={{
              width: 280,
              backgroundColor: theme.desk,
              borderRadius: 18,
              padding: 24,
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 24,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: theme.textOnDesk,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Custom Color
            </Text>

            {/* Preview swatch */}
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: HEX_REGEX.test(
                    hexInput.startsWith('#') ? hexInput : `#${hexInput}`
                  )
                    ? (hexInput.startsWith('#') ? hexInput : `#${hexInput}`)
                    : '#888',
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              />
            </View>

            <TextInput
              value={hexInput}
              onChangeText={setHexInput}
              placeholder="#FF4444"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: '600',
                color: theme.textOnDesk,
                textAlign: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                fontFamily: 'monospace',
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setCustomModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCustomSubmit}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#007AFF',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Apply
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

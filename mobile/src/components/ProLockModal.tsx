import React, { useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/ThemeContext';

interface ProLockModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function ProLockModal({ visible, onClose, featureName }: ProLockModalProps) {
  const theme = useTheme();
  const router = useRouter();

  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      translateY.value = withSpring(400, { damping: 20, stiffness: 200 });
    }
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const description = featureName
    ? `${featureName} is a Pro feature. Upgrade to unlock all Themes, Packs, Templates, and power tools.`
    : 'This is a Pro feature. Upgrade to unlock all Themes, Packs, Templates, and power tools.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable onPress={() => {/* prevent modal close */}}>
          <Animated.View
            style={[
              {
                backgroundColor: theme.desk,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 28,
                paddingBottom: 44,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderColor: theme.border,
              },
              animatedStyle,
            ]}
          >
            {/* Lock icon */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: `${theme.spineAccent}18`,
                borderWidth: 1,
                borderColor: `${theme.spineAccent}44`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <Lock size={28} color={theme.spineAccent} />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: theme.textOnDesk,
                marginBottom: 10,
                textAlign: 'center',
                letterSpacing: -0.3,
              }}
            >
              Unlock Pro
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 14,
                color: theme.muted,
                textAlign: 'center',
                lineHeight: 21,
                marginBottom: 28,
                paddingHorizontal: 8,
              }}
            >
              {description}
            </Text>

            {/* Upgrade button */}
            <Pressable
              onPress={() => {
                router.push('/paywall');
                onClose();
              }}
              style={({ pressed }) => ({
                backgroundColor: theme.spineAccent,
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 32,
                width: '100%',
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
                marginBottom: 14,
              })}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: 0.2,
                }}
              >
                Unlock Pro
              </Text>
            </Pressable>

            {/* Maybe Later */}
            <Pressable onPress={onClose} hitSlop={12}>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.muted,
                  fontWeight: '500',
                }}
              >
                Maybe Later
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

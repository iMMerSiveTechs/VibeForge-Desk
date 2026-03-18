import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

// On iPad Stage Manager, window controls sit in the top-left corner at ~28-32px.
// We push the entire header down an extra STAGE_OFFSET so back buttons never overlap.
const STAGE_OFFSET = Platform.OS === 'ios' ? 20 : 0;

interface StageSafeHeaderProps {
  title: string;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  backgroundColor?: string;
}

export default function StageSafeHeader({
  title,
  onBack,
  rightActions,
  backgroundColor,
}: StageSafeHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? theme.desk;

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingTop: insets.top + STAGE_OFFSET + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: back button or spacer */}
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color={theme.textOnDesk} />
          <Text style={{ fontSize: 16, color: theme.textOnDesk, marginLeft: 2 }}>Back</Text>
        </Pressable>
      ) : (
        <View style={{ width: 60 }} />
      )}

      {/* Center: title */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: theme.textOnDesk,
          fontFamily: 'serif',
          textAlign: 'center',
          flex: 1,
          marginHorizontal: 8,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Right: actions or spacer */}
      {rightActions ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>{rightActions}</View>
      ) : (
        <View style={{ width: 60 }} />
      )}
    </View>
  );
}

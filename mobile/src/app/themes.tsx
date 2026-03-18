import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { THEMES } from '@/lib/theme/themes';

export default function ThemesScreen() {
  const theme = useTheme();
  const currentTheme = useDeskStore((s) => s.currentTheme);
  const setTheme = useDeskStore((s) => s.setTheme);

  const themeEntries = Object.entries(THEMES);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.desk }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.textOnDesk,
            fontFamily: 'serif',
            marginBottom: 20,
          }}
        >
          Themes
        </Text>

        {themeEntries.map(([id, t]) => {
          const isActive = id === currentTheme;
          return (
            <Pressable
              key={id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTheme(id);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.deskHl,
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                borderWidth: isActive ? 1.5 : 0.5,
                borderColor: isActive ? theme.brandGreen : theme.border,
              }}
            >
              {/* Color swatches */}
              <View className="flex-row" style={{ gap: 6, marginRight: 14 }}>
                {t.swatches.map((color, i) => (
                  <View
                    key={i}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: color,
                      borderWidth: 0.5,
                      borderColor: 'rgba(255,255,255,0.15)',
                    }}
                  />
                ))}
              </View>

              {/* Name */}
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '600',
                  color: theme.textOnDesk,
                }}
              >
                {t.name}
              </Text>

              {/* Checkmark */}
              {isActive ? (
                <Check size={20} color={theme.brandGreen} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

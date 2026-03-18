import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import { SCREEN_WIDTH, type PaletteOption } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
  options: PaletteOption[];
}

export default function ElementPalette({ visible, onClose, options }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View
          style={{
            backgroundColor: theme.desk,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.muted,
                opacity: 0.4,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.textOnDesk,
              textAlign: 'center',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            Add Element
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: 16,
              gap: 10,
            }}
          >
            {options.map((opt) => (
              <Pressable
                key={opt.label}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
                style={{
                  width: (SCREEN_WIDTH - 52) / 3,
                  paddingVertical: 16,
                  borderRadius: 14,
                  backgroundColor: theme.deskHl,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: opt.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  {opt.icon}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.textOnDesk,
                    textAlign: 'center',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

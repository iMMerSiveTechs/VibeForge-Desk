import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

interface TextEditModalProps {
  visible: boolean;
  initialText: string;
  title: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export default function TextEditModal({ visible, initialText, title, onClose, onSave }: TextEditModalProps) {
  const theme = useTheme();
  const [text, setText] = useState(initialText);

  const handleSave = useCallback(() => {
    onSave(text);
    onClose();
  }, [text, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: theme.desk,
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 380,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: theme.textOnDesk,
              marginBottom: 14,
            }}
          >
            {title}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            style={{
              backgroundColor: theme.deskHl,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: theme.textOnDesk,
              minHeight: 100,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: theme.deskHl,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.muted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: theme.brandGreen,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

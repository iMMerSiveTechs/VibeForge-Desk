import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronUp, ChevronDown, Copy, Lock, Unlock } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';

interface ContextMenuProps {
  x: number;
  y: number;
  onForward: () => void;
  onBackward: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  locked?: boolean;
}

export default function ContextMenu({
  x,
  y,
  onForward,
  onBackward,
  onDelete,
  onDuplicate,
  onToggleLock,
  locked,
}: ContextMenuProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y - 44,
        flexDirection: 'row',
        backgroundColor: theme.desk,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 20,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onForward}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronUp size={14} color={theme.textOnDesk} />
        <Text style={{ fontSize: 12, color: theme.textOnDesk, fontWeight: '600' }}>Fwd</Text>
      </Pressable>
      <View style={{ width: 1, backgroundColor: theme.border }} />
      <Pressable
        onPress={onBackward}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <ChevronDown size={14} color={theme.textOnDesk} />
        <Text style={{ fontSize: 12, color: theme.textOnDesk, fontWeight: '600' }}>Back</Text>
      </Pressable>
      {onDuplicate ? (
        <>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <Pressable
            onPress={onDuplicate}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Copy size={14} color={theme.textOnDesk} />
          </Pressable>
        </>
      ) : null}
      {onToggleLock ? (
        <>
          <View style={{ width: 1, backgroundColor: theme.border }} />
          <Pressable
            onPress={onToggleLock}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
          >
            {locked ? (
              <Unlock size={14} color="#FFCC00" />
            ) : (
              <Lock size={14} color={theme.textOnDesk} />
            )}
          </Pressable>
        </>
      ) : null}
      <View style={{ width: 1, backgroundColor: theme.border }} />
      <Pressable
        onPress={onDelete}
        style={{ paddingHorizontal: 12, paddingVertical: 10 }}
      >
        <Text style={{ fontSize: 12, color: '#FF4444', fontWeight: '700' }}>Delete</Text>
      </Pressable>
    </View>
  );
}

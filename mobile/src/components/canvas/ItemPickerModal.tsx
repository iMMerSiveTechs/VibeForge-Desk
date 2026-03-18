import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { KINDS } from '@/lib/constants';
import type { VFItem } from '@/lib/state/store';
import { kindDotColor, SCREEN_HEIGHT } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: VFItem) => void;
}

export default function ItemPickerModal({ visible, onClose, onSelect }: Props) {
  const theme = useTheme();
  const itemsById = useDeskStore((s) => s.itemsById);

  const availableItems = useMemo(() => {
    return Object.values(itemsById).filter((i) => !i.archived);
  }, [itemsById]);

  const renderItem = ({ item }: { item: VFItem }) => {
    const dotColor = kindDotColor(item.kind, theme);
    const meta = KINDS[item.kind];
    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: theme.textOnDesk }}
          >
            {item.title || '(untitled)'}
          </Text>
          <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {meta?.label ?? item.kind}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        />
        <View
          style={{
            backgroundColor: theme.desk,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: SCREEN_HEIGHT * 0.6,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
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
              paddingBottom: 12,
            }}
          >
            Select Item to Pin
          </Text>
          {availableItems.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: theme.muted }}>
                No items available. Create some items first.
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableItems}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

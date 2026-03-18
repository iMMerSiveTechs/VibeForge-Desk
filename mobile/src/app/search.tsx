import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, FileText } from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { KINDS, type ItemKind } from '@/lib/constants';
import type { VFItem } from '@/lib/state/store';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const searchItems = useDeskStore((s) => s.searchItems);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchItems(query);
  }, [query, searchItems]);

  const kindLabel = (kind: ItemKind) => KINDS[kind]?.label ?? kind;

  const renderItem = ({ item }: { item: VFItem }) => (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/editor', params: { itemId: item.id } })
      }
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.border,
      }}
    >
      <View className="flex-row items-center" style={{ marginBottom: 4 }}>
        <View
          style={{
            backgroundColor: theme.brandGreen + '22',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.brandGreen }}>
            {kindLabel(item.kind)}
          </Text>
        </View>
      </View>
      <Text
        style={{ fontSize: 15, fontWeight: '600', color: theme.textOnDesk }}
        numberOfLines={1}
      >
        {item.title || '(untitled)'}
      </Text>
      {item.tags.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ gap: 4, marginTop: 6, flexGrow: 0 }}>
          {item.tags.map((tag, i) => (
            <View
              key={`${tag}-${i}`}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 10, color: theme.muted }}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.desk }}>
      {/* Search input */}
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
        }}
      >
        <Search size={18} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search all items..."
          placeholderTextColor={theme.muted}
          autoFocus
          style={{
            flex: 1,
            fontSize: 16,
            color: theme.textOnDesk,
            marginLeft: 10,
            paddingVertical: 4,
          }}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <X size={18} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Results */}
      {!query.trim() ? (
        <View className="flex-1 items-center justify-center">
          <FileText size={40} color={theme.muted} />
          <Text style={{ fontSize: 15, color: theme.muted, marginTop: 12 }}>
            Search across all your items
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text style={{ fontSize: 15, color: theme.muted }}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 }}
        />
      )}
    </SafeAreaView>
  );
}

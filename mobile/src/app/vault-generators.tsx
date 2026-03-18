import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileText,
  Search,
  Scroll,
  Megaphone,
  Target,
  Zap,
  Lightbulb,
  Layout,
  BarChart,
  Rocket,
  FlaskConical,
  Video,
  FileChartLine,
  Wand2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePackTokens } from '@/lib/theme/PackTokensContext';
import useVaultStore from '@/lib/state/vaultStore';
import { VAULT_GENERATORS } from '@/lib/vaultGenerators';
import type { VaultGenerator } from '@/lib/vaultGenerators';

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

function GeneratorIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const props = { size, color };
  switch (name) {
    case 'FileText': return <FileText {...props} />;
    case 'Search': return <Search {...props} />;
    case 'Scroll': return <Scroll {...props} />;
    case 'Megaphone': return <Megaphone {...props} />;
    case 'Target': return <Target {...props} />;
    case 'Zap': return <Zap {...props} />;
    case 'Lightbulb': return <Lightbulb {...props} />;
    case 'Layout': return <Layout {...props} />;
    case 'BarChart': return <BarChart {...props} />;
    case 'Rocket': return <Rocket {...props} />;
    case 'FlaskConical': return <FlaskConical {...props} />;
    case 'Video': return <Video {...props} />;
    case 'FileChartLine': return <FileChartLine {...props} />;
    default: return <FileText {...props} />;
  }
}

// ---------------------------------------------------------------------------
// GeneratorCard
// ---------------------------------------------------------------------------

interface GeneratorCardProps {
  generator: VaultGenerator;
  vaultId: string;
  onCreated: (noteId: string) => void;
}

function GeneratorCard({ generator, vaultId, onCreated }: GeneratorCardProps) {
  const theme = useTheme();
  const tokens = usePackTokens();
  const store = useVaultStore();
  const createNote = useVaultStore((s) => s.createNote);

  const handleCreate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = generator.generate(vaultId, store);
    const generatedNote = result.note;
    const newNote = createNote(
      vaultId,
      generatedNote.title ?? generator.name,
      generatedNote.folderId ?? undefined,
      generatedNote.content ?? '',
    );
    onCreated(newNote.id);
  };

  return (
    <View
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: tokens.cardRadius,
        padding: 16,
        marginBottom: 12,
        borderWidth: tokens.cardBorderWidth,
        borderColor: theme.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: `${theme.spineAccent}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            flexShrink: 0,
          }}
        >
          <GeneratorIcon name={generator.icon} size={22} color={theme.spineAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: theme.textOnDesk,
              marginBottom: 4,
            }}
          >
            {generator.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.muted,
              lineHeight: 19,
            }}
          >
            {generator.description}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleCreate}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.spineAccent : `${theme.spineAccent}20`,
          borderRadius: 10,
          paddingVertical: 11,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: `${theme.spineAccent}50`,
        })}
      >
        {({ pressed }) => (
          <>
            <Wand2 size={15} color={pressed ? '#fff' : theme.spineAccent} style={{ marginRight: 6 }} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: pressed ? '#fff' : theme.spineAccent,
              }}
            >
              Create Note
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VaultGeneratorsScreen() {
  const theme = useTheme();
  const tokens = usePackTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();

  const handleCreated = (noteId: string) => {
    router.push({ pathname: '/vault-note' as any, params: { noteId } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 20 : 0) + 8,
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.desk,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color={theme.textOnDesk} />
          <Text style={{ fontSize: 16, color: theme.textOnDesk, marginLeft: 2 }}>Back</Text>
        </Pressable>

        <Text
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: '700',
            color: theme.textOnDesk,
            fontFamily: 'serif',
            textAlign: 'center',
            marginHorizontal: 8,
          }}
          numberOfLines={1}
        >
          Vault Generators
        </Text>

        <View style={{ width: 60 }} />
      </View>

      {/* List */}
      <FlatList
        data={VAULT_GENERATORS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View
            style={{
              backgroundColor: `${theme.spineAccent}12`,
              borderRadius: tokens.cardRadius,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: `${theme.spineAccent}30`,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Wand2 size={18} color={theme.spineAccent} style={{ marginRight: 10, flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 13, color: theme.muted, lineHeight: 19 }}>
              Generators create structured notes with pre-filled sections — ready to fill in.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GeneratorCard
            generator={item}
            vaultId={vaultId ?? ''}
            onCreated={handleCreated}
          />
        )}
      />
    </View>
  );
}

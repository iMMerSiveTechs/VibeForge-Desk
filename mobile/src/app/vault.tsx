import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Archive, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { fmtDate } from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';

type VaultTab = 'archived' | 'exports';

export default function VaultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<VaultTab>('archived');

  const itemsById = useDeskStore((s) => s.itemsById);
  const toggleArchive = useDeskStore((s) => s.toggleArchive);

  // Memoize archived items to prevent infinite re-renders
  const archivedItems = useMemo(() => {
    return Object.values(itemsById).filter((item) => item.archived);
  }, [itemsById]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader
        title="Vault"
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            marginBottom: 20,
          }}
        >
          {['archived', 'exports'].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab as VaultTab);
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: 'center',
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: theme.spineAccent,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 1,
                  color: activeTab === tab ? theme.textOnDesk : theme.muted,
                  textTransform: 'uppercase',
                }}
              >
                {tab === 'archived' ? 'Archived Items' : 'Exports'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ARCHIVED TAB */}
        {activeTab === 'archived' && (
          <View>
            {/* Archive clarity helper */}
            <View
              style={{
                backgroundColor: theme.deskHl,
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 0.5,
                borderColor: theme.border,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Archive size={14} color={theme.muted} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 11, color: theme.muted, lineHeight: 16 }}>
                Archive hides items from your active view. You can restore any item anytime. Archive is NOT the same as delete — deleted items are gone permanently.
              </Text>
            </View>
            {archivedItems.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Archive size={48} color={theme.muted} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.muted,
                    marginTop: 12,
                  }}
                >
                  No archived items yet
                </Text>
              </View>
            ) : (
              archivedItems.map((item) => (
                <Pressable
                  key={item.id}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleArchive(item.id);
                  }}
                  style={{
                    backgroundColor: theme.deskHl,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: theme.textOnDesk,
                      marginBottom: 4,
                    }}
                  >
                    {item.title || '(Untitled)'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.muted,
                      marginBottom: 8,
                    }}
                    numberOfLines={1}
                  >
                    {item.body.slice(0, 60)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.muted,
                    }}
                  >
                    {fmtDate(new Date(item.updatedAt))}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.muted,
                      marginTop: 6,
                      opacity: 0.6,
                    }}
                  >
                    Long-press to restore
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* EXPORTS TAB */}
        {activeTab === 'exports' && (
          <View>
            <Text
              style={{
                fontSize: 12,
                color: theme.muted,
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              Export your items as backups or share with others. Exports are stored locally.
            </Text>
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Download size={48} color={theme.muted} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.muted,
                  marginTop: 12,
                }}
              >
                No exports yet
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

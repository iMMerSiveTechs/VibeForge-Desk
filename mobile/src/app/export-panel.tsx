import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Archive,
  FileJson,
  FileText,
  Upload,
  Download,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore, {
  type VFItem,
  type PinboardData,
  type ShelfItem,
  createItem,
  uid,
} from '@/lib/state/store';
import { KINDS, type ItemKind } from '@/lib/constants';

// ---------------------------------------------------------------------------
// .vfdesk Archive Schema
// ---------------------------------------------------------------------------

interface VFDeskArchive {
  version: '1.0';
  exportedAt: string;
  items: VFItem[];
  metadata: {
    theme: string;
    colorPack?: string;
    pinboard: PinboardData;
    shelfItems: ShelfItem[];
    activity: Array<{ ts: string; summary: string }>;
  };
}

// ---------------------------------------------------------------------------
// Toast Component
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error';

interface ToastState {
  message: string;
  kind: ToastKind;
  visible: boolean;
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', kind: 'success', visible: false });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, kind, visible: true });
    fadeAnim.setValue(1);
    timerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setToast((t) => ({ ...t, visible: false }));
      });
    }, 3000);
  }, [fadeAnim]);

  return { toast, fadeAnim, showToast };
}

function Toast({ toast, fadeAnim }: { toast: ToastState; fadeAnim: Animated.Value }) {
  const theme = useTheme();
  if (!toast.visible) return null;

  const isSuccess = toast.kind === 'success';
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        backgroundColor: isSuccess ? '#1A2E1F' : '#2E1A1A',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isSuccess ? theme.brandGreen + '50' : theme.danger + '50',
        zIndex: 100,
      }}
    >
      {isSuccess
        ? <CheckCircle size={16} color={theme.brandGreen} />
        : <AlertCircle size={16} color={theme.danger} />}
      <Text
        style={{
          color: isSuccess ? theme.brandGreen : theme.danger,
          fontSize: 13,
          fontWeight: '600',
          marginLeft: 8,
          flex: 1,
        }}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Markdown builder (preserved from original)
// ---------------------------------------------------------------------------

function buildMarkdown(items: VFItem[]): string {
  const lines: string[] = ['# VibeForge Desk Export', '', `Exported: ${new Date().toISOString()}`, ''];

  const grouped: Record<string, VFItem[]> = {};
  for (const item of items) {
    if (!grouped[item.kind]) grouped[item.kind] = [];
    grouped[item.kind].push(item);
  }

  for (const kind of Object.keys(grouped)) {
    const label = KINDS[kind as ItemKind]?.label ?? kind;
    lines.push(`## ${label}`, '');
    for (const item of grouped[kind]) {
      lines.push(`### ${item.title || '(untitled)'}`, '');
      if (item.tags.length > 0) {
        lines.push(`Tags: ${item.tags.join(', ')}`, '');
      }
      if (item.body) {
        lines.push(item.body, '');
      }
      if (item.taskData) {
        for (const t of item.taskData.tasks) {
          lines.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
        }
        lines.push('');
        if (item.taskData.important) lines.push(`**Important:** ${item.taskData.important}`, '');
        if (item.taskData.tomorrow) lines.push(`**Tomorrow:** ${item.taskData.tomorrow}`, '');
        if (item.taskData.gratitude) lines.push(`**Gratitude:** ${item.taskData.gratitude}`, '');
        if (item.taskData.notes) lines.push(`**Notes:** ${item.taskData.notes}`, '');
      }
      lines.push('---', '');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label, count }: { label: string; count?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 18 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 2,
          color: theme.muted,
          textTransform: 'uppercase',
          flex: 1,
        }}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}
        >
          <Text style={{ fontSize: 11, color: theme.muted, fontWeight: '600' }}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Action Row
// ---------------------------------------------------------------------------

function ActionRow({
  icon,
  label,
  description,
  onPress,
  loading,
  accent,
  featured,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  loading?: boolean;
  accent?: string;
  featured?: boolean;
}) {
  const theme = useTheme();
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  if (featured) {
    return (
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: 14,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: accent ? accent + '40' : theme.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              backgroundColor: accent ? accent + '18' : theme.desk,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: accent ? accent + '40' : theme.border,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={accent ?? theme.brandGreen} />
            ) : (
              icon
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textOnDesk, marginBottom: 2 }}>
              {label}
            </Text>
            <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 16 }}>{description}</Text>
          </View>
          <ChevronRight size={16} color={theme.muted} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.deskHl,
          borderRadius: 12,
          padding: 13,
          marginBottom: 8,
          borderWidth: 0.5,
          borderColor: theme.border,
        }}
      >
        <View style={{ width: 32, alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="small" color={accent ?? theme.brandGreen} />
          ) : (
            icon
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textOnDesk }}>{label}</Text>
          <Text style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{description}</Text>
        </View>
        <ChevronRight size={14} color={theme.border} />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function VaultStats({ itemCount, kindCounts }: { itemCount: number; kindCounts: Record<string, number> }) {
  const theme = useTheme();
  const kinds: ItemKind[] = ['plan', 'task', 'note', 'journal', 'goal', 'sticky', 'vault'];

  return (
    <View
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: 14,
        padding: 14,
        borderWidth: 0.5,
        borderColor: theme.border,
        marginBottom: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Layers size={14} color={theme.brandGreen} />
        <Text style={{ fontSize: 11, color: theme.muted, marginLeft: 6, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
          Vault Contents
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textOnDesk }}>{itemCount}</Text>
        <Text style={{ fontSize: 11, color: theme.muted, marginLeft: 4, marginTop: 4 }}>items</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {kinds.map((k) => {
          const count = kindCounts[k] ?? 0;
          if (count === 0) return null;
          const label = KINDS[k]?.label ?? k;
          return (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.desk,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderWidth: 0.5,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 10, color: theme.muted }}>{label}</Text>
              <View
                style={{
                  width: 1,
                  height: 10,
                  backgroundColor: theme.border,
                  marginHorizontal: 6,
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textOnDesk }}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ExportPanelScreen() {
  const theme = useTheme();
  const { toast, fadeAnim, showToast } = useToast();

  const itemsById = useDeskStore((s) => s.itemsById);
  const orderByKind = useDeskStore((s) => s.orderByKind);
  const activity = useDeskStore((s) => s.activity);
  const currentTheme = useDeskStore((s) => s.currentTheme);
  const currentColorPack = useDeskStore((s) => s.currentColorPack);
  const pinboard = useDeskStore((s) => s.pinboard);
  const shelfItems = useDeskStore((s) => s.shelfItems);
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const setTheme = useDeskStore((s) => s.setTheme);

  const allItems = Object.values(itemsById);
  const itemCount = allItems.length;

  // Kind counts for stats bar
  const kindCounts: Record<string, number> = {};
  for (const item of allItems) {
    kindCounts[item.kind] = (kindCounts[item.kind] ?? 0) + 1;
  }

  // Loading states
  const [loadingVfdesk, setLoadingVfdesk] = useState<boolean>(false);
  const [loadingJson, setLoadingJson] = useState<boolean>(false);
  const [loadingMd, setLoadingMd] = useState<boolean>(false);
  const [loadingImportVfdesk, setLoadingImportVfdesk] = useState<boolean>(false);
  const [loadingImportJson, setLoadingImportJson] = useState<boolean>(false);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Export .vfdesk Archive
  // ---------------------------------------------------------------------------

  const exportVFDesk = async () => {
    setLoadingVfdesk(true);
    try {
      const archive: VFDeskArchive = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        items: allItems,
        metadata: {
          theme: currentTheme,
          colorPack: currentColorPack,
          pinboard,
          shelfItems,
          activity,
        },
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `vibeforge-desk-${dateStr}.vfdesk`;
      const fileUri = (FileSystem.documentDirectory ?? '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(archive, null, 2));
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Vault Archive',
        UTI: 'public.json',
      });
      showToast(`Vault archive exported — ${itemCount} items`, 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setLoadingVfdesk(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Export JSON Backup
  // ---------------------------------------------------------------------------

  const exportJSON = async () => {
    setLoadingJson(true);
    try {
      const data = JSON.stringify({ itemsById, orderByKind, activity, currentTheme }, null, 2);
      const fileUri = (FileSystem.documentDirectory ?? '') + 'vibeforge-vault.json';
      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
      showToast('JSON backup exported', 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setLoadingJson(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Export Markdown
  // ---------------------------------------------------------------------------

  const exportMarkdown = async () => {
    setLoadingMd(true);
    try {
      const md = buildMarkdown(allItems);
      const fileUri = (FileSystem.documentDirectory ?? '') + 'vibeforge-export.md';
      await FileSystem.writeAsStringAsync(fileUri, md);
      await Sharing.shareAsync(fileUri, { mimeType: 'text/markdown' });
      showToast('Markdown export ready', 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setLoadingMd(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Import .vfdesk Archive
  // ---------------------------------------------------------------------------

  const importVFDesk = async () => {
    setLoadingImportVfdesk(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled) {
        setLoadingImportVfdesk(false);
        return;
      }
      const file = result.assets?.[0];
      if (!file) {
        setLoadingImportVfdesk(false);
        return;
      }

      // File size check
      if (file.size && file.size > 50 * 1024 * 1024) {
        showToast('File too large. Maximum size is 50MB.', 'error');
        setLoadingImportVfdesk(false);
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri);
      const parsed = JSON.parse(content) as Record<string, unknown>;

      // Validate structure
      if (!parsed.version) {
        showToast('Invalid archive — missing version field.', 'error');
        setLoadingImportVfdesk(false);
        return;
      }
      if (!Array.isArray(parsed.items)) {
        showToast('Invalid archive — items field is missing or invalid.', 'error');
        setLoadingImportVfdesk(false);
        return;
      }

      const items = parsed.items as VFItem[];
      const meta = parsed.metadata as VFDeskArchive['metadata'] | undefined;

      Alert.alert(
        'Import Vault Archive',
        `This will add ${items.length} items to your workspace${meta?.theme ? ' and restore theme settings' : ''}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoadingImportVfdesk(false) },
          {
            text: 'Import',
            style: 'default',
            onPress: () => {
              try {
                for (const item of items) {
                  upsertItem(item);
                }
                if (meta?.theme) {
                  setTheme(meta.theme);
                }
                showToast(`Imported ${items.length} items successfully`, 'success');
              } catch {
                showToast('Import failed — invalid data.', 'error');
              } finally {
                setLoadingImportVfdesk(false);
              }
            },
          },
        ],
      );
    } catch {
      showToast('Could not read the file. Make sure it is a valid .vfdesk archive.', 'error');
      setLoadingImportVfdesk(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Import JSON Vault
  // ---------------------------------------------------------------------------

  const importVault = async () => {
    setLoadingImportJson(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) {
        setLoadingImportJson(false);
        return;
      }
      const file = result.assets?.[0];
      if (!file) {
        setLoadingImportJson(false);
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content) as Record<string, unknown>;

      if (data.itemsById && typeof data.itemsById === 'object') {
        const items = Object.values(data.itemsById) as VFItem[];
        Alert.alert(
          'Import JSON Backup',
          `This will add ${items.length} items to your workspace. Continue?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setLoadingImportJson(false) },
            {
              text: 'Import',
              style: 'default',
              onPress: () => {
                try {
                  for (const item of items) {
                    upsertItem(item);
                  }
                  showToast(`Imported ${items.length} items`, 'success');
                } catch {
                  showToast('Import failed — invalid data.', 'error');
                } finally {
                  setLoadingImportJson(false);
                }
              },
            },
          ],
        );
      } else {
        showToast('Invalid JSON — no itemsById found.', 'error');
        setLoadingImportJson(false);
      }
    } catch {
      showToast('Could not parse the file. Make sure it is a valid JSON backup.', 'error');
      setLoadingImportJson(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Load Demo Workspace
  // ---------------------------------------------------------------------------

  const loadDemoWorkspace = () => {
    Alert.alert(
      'Load Demo Workspace',
      'This will add sample items to try all features of VibeForge Desk. Your existing items will not be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Demo',
          style: 'default',
          onPress: async () => {
            setLoadingDemo(true);
            try {
              // Plan item
              const planItem = createItem('plan');
              planItem.title = 'Q4 Product Roadmap';
              planItem.body = '## Vision\nBuild the most focused productivity tool for founders.\n\n## Key Milestones\n- Ship v1.0 to App Store\n- Reach 1000 active users\n- Launch Pro tier';
              upsertItem(planItem);

              // Task item
              const taskItem = createItem('task');
              taskItem.title = "Today's Focus";
              if (taskItem.taskData) {
                taskItem.taskData.tasks = [
                  { id: uid(), text: 'Review app analytics', done: true },
                  { id: uid(), text: 'Write release notes', done: false },
                  { id: uid(), text: 'Test onboarding flow', done: false },
                ];
              }
              upsertItem(taskItem);

              // Sticky item
              const stickyItem = createItem('sticky');
              stickyItem.title = 'Quick Idea';
              stickyItem.body = 'Feature idea: AI-powered daily digest summarizing all your notes';
              stickyItem.stickyMeta = { color: 'yellow' };
              upsertItem(stickyItem);

              // Note item
              const noteItem = createItem('note');
              noteItem.title = 'Meeting Notes - Product Sync';
              noteItem.body = 'Attendees: Design, Engineering, Product\n\nDecisions:\n1. Ship the wizard first\n2. Defer AI features to v1.2\n3. Weekly syncs on Fridays';
              upsertItem(noteItem);

              // Journal item
              const journalItem = createItem('journal');
              journalItem.title = 'Day 1';
              journalItem.body = 'Today we shipped the Desk Setup Wizard. The team is energized and focused.';
              upsertItem(journalItem);

              // Goal item
              const goalItem = createItem('goal');
              goalItem.title = 'App Store Launch';
              goalItem.body = '{"progress":65,"description":"Launch VibeForge Desk on the App Store with 5-star rating"}';
              goalItem.goalMeta = { status: 'active', linkedItemIds: [] };
              upsertItem(goalItem);

              showToast('Demo workspace loaded — 6 items added', 'success');
            } catch {
              showToast('Failed to load demo workspace.', 'error');
            } finally {
              setLoadingDemo(false);
            }
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Archive size={18} color={theme.brandGreen} />
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: theme.textOnDesk,
              marginLeft: 8,
              letterSpacing: -0.3,
            }}
          >
            Vault Archive
          </Text>
        </View>

        {/* Stats */}
        <VaultStats itemCount={itemCount} kindCounts={kindCounts} />

        {/* Primary Export: .vfdesk */}
        <SectionHeader label="Featured Export" />
        <View
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 8,
            borderWidth: 1,
            borderColor: theme.brandGreen + '30',
            backgroundColor: theme.deskHl,
          }}
        >
          {/* Badge */}
          <View
            style={{
              backgroundColor: theme.brandGreen + '18',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: theme.brandGreen + '25',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Sparkles size={11} color={theme.brandGreen} />
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: theme.brandGreen,
                marginLeft: 5,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Primary Format
            </Text>
          </View>
          <Pressable
            onPress={exportVFDesk}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: theme.brandGreen + '18',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.brandGreen + '40',
              }}
            >
              {loadingVfdesk ? (
                <ActivityIndicator size="small" color={theme.brandGreen} />
              ) : (
                <Archive size={22} color={theme.brandGreen} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textOnDesk, marginBottom: 3 }}>
                .vfdesk Archive
              </Text>
              <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 17 }}>
                Complete vault snapshot with all items, theme, pinboard, and shelf config
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <View
                  style={{
                    backgroundColor: theme.desk,
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <Text style={{ fontSize: 10, color: theme.muted, fontFamily: 'monospace' }}>
                    vibeforge-desk-YYYY-MM-DD.vfdesk
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRight size={18} color={theme.brandGreen + '80'} />
          </Pressable>
        </View>

        {/* Other Exports */}
        <SectionHeader label="Additional Formats" />
        <ActionRow
          icon={<FileJson size={18} color={theme.brandGreen} />}
          label="JSON Backup"
          description="Full data backup for manual restore"
          onPress={exportJSON}
          loading={loadingJson}
          accent={theme.brandGreen}
        />
        <ActionRow
          icon={<FileText size={18} color={theme.ruleBlue} />}
          label="Markdown"
          description="Formatted document for reading or publishing"
          onPress={exportMarkdown}
          loading={loadingMd}
          accent={theme.ruleBlue}
        />

        {/* Import */}
        <SectionHeader label="Import" />
        <ActionRow
          icon={<Download size={18} color={theme.brandGreen} />}
          label="Import .vfdesk Archive"
          description="Restore from a vault archive file"
          onPress={importVFDesk}
          loading={loadingImportVfdesk}
          accent={theme.brandGreen}
          featured
        />
        <ActionRow
          icon={<Upload size={18} color={theme.muted} />}
          label="Import JSON Backup"
          description="Merge items from a JSON backup file"
          onPress={importVault}
          loading={loadingImportJson}
          accent={theme.muted}
        />

        {/* Demo Workspace */}
        <SectionHeader label="Try it Out" />
        <Pressable
          onPress={loadDemoWorkspace}
          style={{
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.spineAccent + '60',
            backgroundColor: theme.spineAccent + '08',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              backgroundColor: theme.spineAccent + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loadingDemo ? (
              <ActivityIndicator size="small" color={theme.spineAccent} />
            ) : (
              <Sparkles size={20} color={theme.spineAccent} />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textOnDesk, marginBottom: 2 }}>
              Load Demo Workspace
            </Text>
            <Text style={{ fontSize: 12, color: theme.muted, lineHeight: 16 }}>
              Add 6 sample items to explore all features
            </Text>
          </View>
          <ChevronRight size={16} color={theme.spineAccent + '80'} />
        </Pressable>
      </ScrollView>

      {/* Toast */}
      <Toast toast={toast} fadeAnim={fadeAnim} />
    </View>
  );
}

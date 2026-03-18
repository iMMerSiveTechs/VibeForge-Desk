import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import {
  Download,
  Clock,
  ChevronRight,
  Archive,
  BookOpen,
  Target,
  FileText,
  CheckSquare,
  Palette,
  Zap,
  Layout,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import StageSafeHeader from '@/components/StageSafeHeader';
import { deferredNavigate } from '@/lib/navigation';

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: theme.muted,
        marginBottom: 8,
        marginTop: 24,
        paddingHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Grouped rows container
// ---------------------------------------------------------------------------

function RowGroup({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.deskHl,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: theme.border,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Settings row
// ---------------------------------------------------------------------------

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  tappable = true,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  tappable?: boolean;
}) {
  const theme = useTheme();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: theme.border,
      }}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: theme.textOnDesk,
          marginLeft: 12,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 13, color: theme.muted, marginRight: 6 }}>{value}</Text>
      ) : null}
      {tappable ? <ChevronRight size={18} color={theme.muted} /> : null}
    </View>
  );

  if (!tappable || !onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

// ---------------------------------------------------------------------------
// Settings Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const theme = useTheme();

  const itemsById = useDeskStore((s) => s.itemsById);
  const orderByKind = useDeskStore((s) => s.orderByKind);
  const currentTheme = useDeskStore((s) => s.currentTheme);
  const sampleContentLoaded = useDeskStore((s) => s.sampleContentLoaded);
  const clearSampleContent = useDeskStore((s) => s.clearSampleContent);
  const resetWorkspace = useDeskStore((s) => s.resetWorkspace);

  const counts = useMemo(() => {
    return {
      plan: (orderByKind.plan ?? []).length,
      task: (orderByKind.task ?? []).length,
      journal: (orderByKind.journal ?? []).length,
      goal: (orderByKind.goal ?? []).length,
      vault: (orderByKind.vault ?? []).filter((id) => itemsById[id]?.archived).length,
    };
  }, [orderByKind, itemsById]);

  const themeDisplayName = currentTheme
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleClearSample = () => {
    Alert.alert(
      'Clear Sample Content',
      'This will remove all sample pins, tasks, notes, and stickies. Your own content will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Sample Content',
          style: 'destructive',
          onPress: () => clearSampleContent(),
        },
      ],
    );
  };

  const handleResetWorkspace = () => {
    Alert.alert(
      'Reset Workspace',
      'This will permanently delete all your items, pins, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'All data will be wiped and the app will return to its initial state.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Reset',
                  style: 'destructive',
                  onPress: () => resetWorkspace(),
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader title="Settings" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 48,
          paddingTop: 4,
        }}
      >
        {/* APP section */}
        <SectionHeader label="APP" />
        <RowGroup>
          <SettingsRow
            icon={<View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: theme.spineAccent }} />}
            label="VibeForge Desk"
            tappable={false}
            isLast={false}
          />
          <SettingsRow
            icon={<Layout size={18} color={theme.spineAccent} />}
            label="Desk Setup"
            onPress={() => deferredNavigate('/desk-setup')}
            isLast={false}
          />
          <SettingsRow
            icon={<View style={{ width: 20, height: 20 }} />}
            label="Version"
            value="v1.0.0"
            tappable={false}
            isLast
          />
        </RowGroup>

        {/* TOOLS section */}
        <SectionHeader label="TOOLS" />
        <RowGroup>
          <SettingsRow
            icon={<FileText size={18} color={theme.spineAccent} />}
            label="Master Plan"
            value={`${counts.plan} items`}
            onPress={() => deferredNavigate({ pathname: '/tool-list', params: { kind: 'plan' } })}
          />
          <SettingsRow
            icon={<CheckSquare size={18} color={theme.plannerGreen} />}
            label="Task Planner"
            value={`${counts.task} items`}
            onPress={() => deferredNavigate({ pathname: '/tool-list', params: { kind: 'task' } })}
          />
          <SettingsRow
            icon={<BookOpen size={18} color={theme.ruleBlue} />}
            label="Journal"
            value={`${counts.journal} entries`}
            onPress={() => deferredNavigate('/journal')}
          />
          <SettingsRow
            icon={<Target size={18} color={theme.brandGreen} />}
            label="Goals"
            value={`${counts.goal} goals`}
            onPress={() => deferredNavigate('/goals')}
            isLast
          />
        </RowGroup>

        {/* DATA section */}
        <SectionHeader label="DATA" />
        <RowGroup>
          <SettingsRow
            icon={<Download size={18} color={theme.brandGreen} />}
            label="Export & Backup"
            onPress={() => deferredNavigate('/export-panel')}
          />
          <SettingsRow
            icon={<Archive size={18} color={theme.muted} />}
            label="Archived Items"
            value={counts.vault > 0 ? String(counts.vault) : undefined}
            onPress={() => deferredNavigate('/vault')}
          />
          <SettingsRow
            icon={<Clock size={18} color={theme.muted} />}
            label="Activity Timeline"
            onPress={() => deferredNavigate('/activity')}
            isLast
          />
        </RowGroup>

        {/* DATA description */}
        <Text
          style={{
            fontSize: 11,
            color: theme.muted,
            marginTop: 6,
            marginBottom: 4,
            lineHeight: 16,
            paddingHorizontal: 4,
          }}
        >
          Vault creates shareable exports/backups. Archive only hides items from active view.
        </Text>

        {/* APPEARANCE section */}
        <SectionHeader label="APPEARANCE" />
        <RowGroup>
          <SettingsRow
            icon={<Palette size={18} color={theme.spineAccent} />}
            label="Theme"
            value={themeDisplayName}
            onPress={() => deferredNavigate('/(tabs)/studio')}
            isLast
          />
        </RowGroup>

        {/* PRO section */}
        <SectionHeader label="PRO" />
        <RowGroup>
          <SettingsRow
            icon={<Zap size={18} color={theme.spineAccent} />}
            label="Upgrade to Pro"
            onPress={() => deferredNavigate('/paywall')}
            isLast
          />
        </RowGroup>

        {/* WORKSPACE section */}
        <SectionHeader label="WORKSPACE" />
        <RowGroup>
          {sampleContentLoaded ? (
            <SettingsRow
              icon={<Trash2 size={18} color="#f59e0b" />}
              label="Clear Sample Content"
              onPress={handleClearSample}
              isLast={false}
            />
          ) : null}
          <SettingsRow
            icon={<RotateCcw size={18} color="#ef4444" />}
            label="Reset Workspace"
            onPress={handleResetWorkspace}
            isLast
          />
        </RowGroup>
        <Text
          style={{
            fontSize: 11,
            color: theme.muted,
            marginTop: 6,
            marginBottom: 4,
            lineHeight: 16,
            paddingHorizontal: 4,
          }}
        >
          Reset Workspace permanently wipes all data and returns the app to its initial state.
        </Text>
      </ScrollView>
    </View>
  );
}

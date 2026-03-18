/**
 * scan-preview.tsx
 *
 * Scan-to-Desk coordinator. Flow:
 *  1. Screen opens with explicit UI — kind picker, source label, Capture button
 *  2. User taps Capture/Choose → picker launches on demand (no useEffect auto-launch)
 *  3. If cancelled / no asset → stay on screen, do NOT create item
 *  4. On success → persist photo, create item, navigate to editor
 *  5. [Background] Run OCR and patch item with extracted text if successful
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore, { createItem, uid } from '@/lib/state/store';
import type { VFPhoto } from '@/lib/state/store';
import { launchPicker } from '@/lib/services/scanToDesk';
import StageSafeHeader from '@/components/StageSafeHeader';
import { safeDismiss } from '@/lib/safeClose';
import type { CoreKind } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Copy the picked URI into app-local storage so it survives cache clears. */
async function persistPhoto(
  sourceUri: string,
  _source: 'camera' | 'library',
): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}vf_photos/`;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const dest = `${dir}${uid()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}

// ---------------------------------------------------------------------------
// Kind pill data — only the 4 CoreKinds that support photos via the editor
// ---------------------------------------------------------------------------

const KIND_PILLS: Array<{ kind: CoreKind; label: string }> = [
  { kind: 'sticky', label: 'Sticky' },
  { kind: 'note', label: 'Note' },
  { kind: 'plan', label: 'Plan' },
  { kind: 'task', label: 'Task' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type Stage = 'ready' | 'saving' | 'perm_denied' | 'error';

export default function ScanPreviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source: string }>();
  const safeSource: 'camera' | 'library' =
    source === 'camera' || source === 'library' ? source : 'camera';

  const upsertItem = useDeskStore((s) => s.upsertItem);

  const [stage, setStage] = useState<Stage>('ready');
  const [selectedKind, setSelectedKind] = useState<CoreKind>('note');
  const [isSaving, setIsSaving] = useState(false);

  // Guard against double-tap
  const isLaunching = useRef(false);

  const sourceLabel = safeSource === 'camera' ? 'Camera' : 'Photo Library';
  const buttonLabel = safeSource === 'camera' ? 'Capture' : 'Choose Photo';
  const kindLabel = KIND_PILLS.find((p) => p.kind === selectedKind)?.label ?? 'Note';

  const handleCapture = async () => {
    if (isLaunching.current || isSaving) return;
    isLaunching.current = true;

    try {
      const picked = await launchPicker(safeSource);

      if (!picked.asset || picked.error === 'Cancelled') {
        // User cancelled — stay on screen
        isLaunching.current = false;
        return;
      }

      if (picked.error === 'Camera permission is required to scan.') {
        setStage('perm_denied');
        isLaunching.current = false;
        return;
      }

      if (picked.error) {
        Alert.alert("Couldn't open camera. Try again.");
        isLaunching.current = false;
        return;
      }

      // ── Success path ──────────────────────────────────────────────────────
      setIsSaving(true);
      setStage('saving');

      const localUri = await persistPhoto(picked.asset.uri, safeSource);

      const photo: VFPhoto = {
        id: uid(),
        uri: localUri,
        addedAt: new Date().toISOString(),
        source: safeSource,
      };

      const item = createItem(selectedKind);
      item.title = `Scanned ${kindLabel}`;
      item.photos = [photo];
      upsertItem(item);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to editor — replace so Back goes home, not back here
      router.replace({ pathname: '/editor', params: { itemId: item.id } });

    } catch {
      Alert.alert("Couldn't open camera. Try again.");
      isLaunching.current = false;
      setIsSaving(false);
      setStage('ready');
    }
  };

  // ── Permission denied screen ───────────────────────────────────────────────

  if (stage === 'perm_denied') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk }}>
        <StageSafeHeader title="Scan to Desk" onBack={() => safeDismiss(router)} />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.textOnDesk,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Camera Permission Required
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.muted,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            Please allow camera access in Settings to use Scan to Desk.
          </Text>
          <Pressable
            onPress={() => Linking.openSettings()}
            style={{
              backgroundColor: theme.brandGreen,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Open Settings
            </Text>
          </Pressable>
          <Pressable onPress={() => safeDismiss(router)}>
            <Text style={{ color: theme.muted, fontSize: 14 }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Saving screen ──────────────────────────────────────────────────────────

  if (stage === 'saving' || isSaving) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk }}>
        <StageSafeHeader title="Scan to Desk" onBack={() => safeDismiss(router)} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.brandGreen} />
          <Text style={{ fontSize: 15, color: theme.muted, marginTop: 16 }}>
            Saving photo...
          </Text>
        </View>
      </View>
    );
  }

  // ── Ready screen (default) ─────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader title="Scan to Desk" onBack={() => safeDismiss(router)} />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        {/* Source label */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.muted,
            marginBottom: 24,
            textTransform: 'uppercase',
          }}
        >
          Source: {sourceLabel}
        </Text>

        {/* Item type picker */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: theme.textOnDesk,
            marginBottom: 12,
          }}
        >
          Save as
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 8, paddingRight: 8, marginBottom: 40 }}
        >
          {KIND_PILLS.map(({ kind, label }) => {
            const isSelected = selectedKind === kind;
            return (
              <Pressable
                key={kind}
                onPress={() => setSelectedKind(kind)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: isSelected ? theme.brandGreen : theme.ink + '15',
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: theme.ink + '20',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#fff' : theme.textOnDesk,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Spacer to push button toward center */}
        <View style={{ flex: 1 }} />

        {/* Capture button */}
        <Pressable
          onPress={handleCapture}
          disabled={isSaving}
          style={{
            backgroundColor: isSaving ? theme.brandGreen + '66' : theme.brandGreen,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
            {buttonLabel}
          </Text>
        </Pressable>

        {/* Cancel link */}
        <Pressable
          onPress={() => safeDismiss(router)}
          style={{ alignItems: 'center', marginBottom: 40 }}
        >
          <Text style={{ color: theme.muted, fontSize: 15 }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

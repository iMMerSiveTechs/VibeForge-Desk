import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Package,
  FileText,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePackTokens } from '@/lib/theme/PackTokensContext';
import useVaultStore from '@/lib/state/vaultStore';
import type { ContextPack, VaultNote } from '@/lib/state/vaultStore';

// ---------------------------------------------------------------------------
// NotePickerModal
// ---------------------------------------------------------------------------

interface NotePickerModalProps {
  visible: boolean;
  notes: VaultNote[];
  selectedNoteIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}

function NotePickerModal({
  visible,
  notes,
  selectedNoteIds,
  onToggle,
  onClose,
}: NotePickerModalProps) {
  const theme = useTheme();
  const tokens = usePackTokens();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.desk,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: '70%',
          }}
          onPress={() => { /* prevent close */ }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <FileText size={18} color={theme.spineAccent} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textOnDesk, flex: 1 }}>
              Select Notes
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.muted} />
            </Pressable>
          </View>

          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const selected = selectedNoteIds.includes(item.id);
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggle(item.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: selected ? `${theme.spineAccent}20` : theme.deskHl,
                    borderRadius: tokens.cardRadius,
                    marginBottom: 8,
                    borderWidth: selected ? 1 : tokens.cardBorderWidth,
                    borderColor: selected ? theme.spineAccent : theme.border,
                  }}
                >
                  <FileText size={15} color={selected ? theme.spineAccent : theme.muted} style={{ marginRight: 10 }} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: selected ? theme.textOnDesk : theme.muted,
                      fontWeight: selected ? '600' : '400',
                    }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {selected ? <Check size={16} color={theme.spineAccent} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: theme.muted, textAlign: 'center', paddingVertical: 20, fontSize: 14 }}>
                No notes in this vault
              </Text>
            }
          />

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 12,
              paddingVertical: 14,
              borderRadius: tokens.cardRadius,
              backgroundColor: theme.spineAccent,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PackDetail
// ---------------------------------------------------------------------------

interface PackDetailProps {
  pack: ContextPack;
  vaultId: string;
  onBack: () => void;
}

function PackDetail({ pack, vaultId, onBack }: PackDetailProps) {
  const theme = useTheme();
  const tokens = usePackTokens();
  const notesById = useVaultStore((s) => s.notesById);
  const updateContextPack = useVaultStore((s) => s.updateContextPack);

  const [title, setTitle] = useState(pack.title);
  const [brief, setBrief] = useState(pack.operatingBrief);
  const [doInput, setDoInput] = useState('');
  const [dontInput, setDontInput] = useState('');
  const [showNotePicker, setShowNotePicker] = useState(false);

  const vaultNotes = useMemo(
    () => Object.values(notesById).filter((n) => n.vaultId === vaultId),
    [notesById, vaultId],
  );

  const selectedNotes = useMemo<VaultNote[]>(
    () =>
      pack.noteIds
        .map((id) => notesById[id])
        .filter((n): n is VaultNote => n !== undefined),
    [pack.noteIds, notesById],
  );

  const saveField = useCallback(
    (updates: Partial<Omit<ContextPack, 'id' | 'vaultId'>>) => {
      updateContextPack(pack.id, updates);
    },
    [pack.id, updateContextPack],
  );

  const handleToggleNote = (noteId: string) => {
    const current = pack.noteIds;
    const next = current.includes(noteId)
      ? current.filter((id) => id !== noteId)
      : [...current, noteId];
    saveField({ noteIds: next });
  };

  const addDoRule = () => {
    const trimmed = doInput.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveField({ rulesDo: [...pack.rulesDo, trimmed] });
    setDoInput('');
  };

  const addDontRule = () => {
    const trimmed = dontInput.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveField({ rulesDont: [...pack.rulesDont, trimmed] });
    setDontInput('');
  };

  const removeDoRule = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = pack.rulesDo.filter((_, i) => i !== index);
    saveField({ rulesDo: next });
  };

  const removeDontRule = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = pack.rulesDont.filter((_, i) => i !== index);
    saveField({ rulesDont: next });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.desk }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back link */}
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
          <ChevronLeft size={18} color={theme.spineAccent} />
          <Text style={{ color: theme.spineAccent, fontSize: 14, fontWeight: '600' }}>
            All Packs
          </Text>
        </Pressable>

        {/* Title */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={() => saveField({ title })}
          placeholder="Pack title..."
          placeholderTextColor={theme.muted}
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.textOnDesk,
            fontFamily: 'serif',
            marginBottom: 20,
            paddingVertical: 4,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}
        />

        {/* Operating Brief */}
        <SectionHeader label="Operating Brief" />
        <TextInput
          value={brief}
          onChangeText={setBrief}
          onBlur={() => saveField({ operatingBrief: brief })}
          multiline
          placeholder="Describe the purpose, context, and guidelines for this pack..."
          placeholderTextColor={theme.muted}
          style={{
            backgroundColor: theme.deskHl,
            borderRadius: tokens.cardRadius,
            borderWidth: tokens.cardBorderWidth,
            borderColor: theme.border,
            padding: 14,
            color: theme.textOnDesk,
            fontSize: 14,
            lineHeight: 21,
            minHeight: 100,
            textAlignVertical: 'top',
            marginBottom: 24,
          }}
        />

        {/* Reference Notes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <SectionHeader label="Reference Notes" />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowNotePicker(true);
            }}
            style={{
              marginLeft: 'auto',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${theme.spineAccent}20`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Plus size={13} color={theme.spineAccent} style={{ marginRight: 3 }} />
            <Text style={{ color: theme.spineAccent, fontSize: 12, fontWeight: '600' }}>Add Note</Text>
          </Pressable>
        </View>

        {selectedNotes.length === 0 ? (
          <Text style={{ color: theme.muted, fontSize: 13, marginBottom: 24, fontStyle: 'italic' }}>
            No notes selected. Tap Add Note to include context.
          </Text>
        ) : (
          <View style={{ marginBottom: 24 }}>
            {selectedNotes.map((note) => (
              <View
                key={note.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.deskHl,
                  borderRadius: tokens.cardRadius,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: tokens.cardBorderWidth,
                  borderColor: theme.border,
                }}
              >
                <FileText size={14} color={theme.muted} style={{ marginRight: 8 }} />
                <Text
                  style={{ flex: 1, fontSize: 13, color: theme.textOnDesk }}
                  numberOfLines={1}
                >
                  {note.title}
                </Text>
                <Text style={{ fontSize: 11, color: theme.muted, marginRight: 8 }}>
                  {note.path}
                </Text>
                <Pressable onPress={() => handleToggleNote(note.id)} hitSlop={8}>
                  <X size={14} color={theme.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Rules DO */}
        <SectionHeader label="Rules — DO" accent={theme.brandGreen} />
        <View style={{ marginBottom: 16 }}>
          {pack.rulesDo.map((rule, i) => (
            <View
              key={`do-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${theme.brandGreen}12`,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: `${theme.brandGreen}30`,
              }}
            >
              <Check size={13} color={theme.brandGreen} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.textOnDesk }}>{rule}</Text>
              <Pressable onPress={() => removeDoRule(i)} hitSlop={8}>
                <X size={13} color={theme.muted} />
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={doInput}
              onChangeText={setDoInput}
              placeholder="Add a DO rule..."
              placeholderTextColor={theme.muted}
              onSubmitEditing={addDoRule}
              returnKeyType="done"
              style={{
                flex: 1,
                backgroundColor: theme.deskHl,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 9,
                color: theme.textOnDesk,
                fontSize: 13,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            />
            <Pressable
              onPress={addDoRule}
              style={{
                backgroundColor: `${theme.brandGreen}30`,
                borderRadius: 8,
                padding: 9,
              }}
            >
              <Plus size={16} color={theme.brandGreen} />
            </Pressable>
          </View>
        </View>

        {/* Rules DONT */}
        <SectionHeader label="Rules — DON'T" accent={theme.danger} />
        <View style={{ marginBottom: 16 }}>
          {pack.rulesDont.map((rule, i) => (
            <View
              key={`dont-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${theme.danger}12`,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: `${theme.danger}30`,
              }}
            >
              <X size={13} color={theme.danger} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.textOnDesk }}>{rule}</Text>
              <Pressable onPress={() => removeDontRule(i)} hitSlop={8}>
                <X size={13} color={theme.muted} />
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={dontInput}
              onChangeText={setDontInput}
              placeholder="Add a DON'T rule..."
              placeholderTextColor={theme.muted}
              onSubmitEditing={addDontRule}
              returnKeyType="done"
              style={{
                flex: 1,
                backgroundColor: theme.deskHl,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 9,
                color: theme.textOnDesk,
                fontSize: 13,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            />
            <Pressable
              onPress={addDontRule}
              style={{
                backgroundColor: `${theme.danger}20`,
                borderRadius: 8,
                padding: 9,
              }}
            >
              <Plus size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <NotePickerModal
        visible={showNotePicker}
        notes={vaultNotes}
        selectedNoteIds={pack.noteIds}
        onToggle={handleToggleNote}
        onClose={() => setShowNotePicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// SectionHeader helper
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string;
  accent?: string;
}

function SectionHeader({ label, accent }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: accent ?? theme.muted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {label}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// PackCard
// ---------------------------------------------------------------------------

interface PackCardProps {
  pack: ContextPack;
  notesById: Record<string, VaultNote>;
  onPress: () => void;
  onLongPress: () => void;
}

function PackCard({ pack, notesById, onPress, onLongPress }: PackCardProps) {
  const theme = useTheme();
  const tokens = usePackTokens();
  const noteCount = pack.noteIds.filter((id) => notesById[id] !== undefined).length;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => ({
        backgroundColor: pressed ? `${theme.spineAccent}15` : theme.deskHl,
        borderRadius: tokens.cardRadius,
        padding: 16,
        marginBottom: 10,
        borderWidth: tokens.cardBorderWidth,
        borderColor: theme.border,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Package size={16} color={theme.spineAccent} style={{ marginRight: 8 }} />
        <Text
          style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.textOnDesk }}
          numberOfLines={1}
        >
          {pack.title}
        </Text>
        <ChevronRight size={16} color={theme.muted} />
      </View>

      {pack.operatingBrief.trim().length > 0 && (
        <Text
          style={{
            fontSize: 13,
            color: theme.muted,
            lineHeight: 19,
            marginBottom: 10,
          }}
          numberOfLines={2}
        >
          {pack.operatingBrief}
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <BadgePill label={`${noteCount} note${noteCount !== 1 ? 's' : ''}`} color={theme.ruleBlue} />
        <BadgePill label={`${pack.rulesDo.length} do`} color={theme.brandGreen} />
        <BadgePill label={`${pack.rulesDont.length} don't`} color={theme.danger} />
      </View>
    </Pressable>
  );
}

function BadgePill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: `${color}20`,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VaultContextPacksScreen() {
  const theme = useTheme();
  const tokens = usePackTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();

  const contextPacksById = useVaultStore((s) => s.contextPacksById);
  const notesById = useVaultStore((s) => s.notesById);
  const createContextPack = useVaultStore((s) => s.createContextPack);
  const deleteContextPack = useVaultStore((s) => s.deleteContextPack);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const vaultPacks = useMemo(
    () => Object.values(contextPacksById).filter((p) => p.vaultId === vaultId),
    [contextPacksById, vaultId],
  );

  const selectedPack = selectedPackId != null ? contextPacksById[selectedPackId] ?? null : null;

  const handleCreatePack = () => {
    Alert.prompt(
      'New Context Pack',
      'Enter a name for this pack:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (text) => {
            const trimmed = (text ?? '').trim();
            if (!trimmed || !vaultId) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const pack = createContextPack(vaultId, trimmed);
            setSelectedPackId(pack.id);
          },
        },
      ],
      'plain-text',
    );
  };

  const handleDeletePack = (packId: string) => {
    const pack = contextPacksById[packId];
    Alert.alert(
      'Delete Pack',
      `Delete "${pack?.title ?? 'this pack'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteContextPack(packId);
            if (selectedPackId === packId) setSelectedPackId(null);
          },
        },
      ],
    );
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
          onPress={() => {
            if (selectedPackId != null) {
              setSelectedPackId(null);
            } else {
              router.back();
            }
          }}
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
          {selectedPack != null ? selectedPack.title : 'Context Packs'}
        </Text>

        {selectedPackId == null ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleCreatePack();
            }}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.spineAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => handleDeletePack(selectedPackId)}
            hitSlop={8}
            style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 size={18} color={theme.muted} />
          </Pressable>
        )}
      </View>

      {/* Body */}
      {selectedPack != null ? (
        <PackDetail
          pack={selectedPack}
          vaultId={vaultId ?? ''}
          onBack={() => setSelectedPackId(null)}
        />
      ) : (
        <FlatList
          data={vaultPacks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <PackCard
              pack={item}
              notesById={notesById}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPackId(item.id);
              }}
              onLongPress={() => handleDeletePack(item.id)}
            />
          )}
          ListEmptyComponent={
            <View
              style={{
                backgroundColor: theme.deskHl,
                borderRadius: tokens.cardRadius,
                padding: 32,
                alignItems: 'center',
                borderWidth: tokens.cardBorderWidth,
                borderColor: theme.border,
                marginTop: 24,
              }}
            >
              <Package size={36} color={theme.muted} style={{ marginBottom: 12 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: theme.textOnDesk,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                No context packs yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.muted,
                  textAlign: 'center',
                  lineHeight: 19,
                  marginBottom: 20,
                }}
              >
                Context packs bundle notes and rules to feed into your AI workflows.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleCreatePack();
                }}
                style={{
                  backgroundColor: theme.spineAccent,
                  borderRadius: tokens.cardRadius,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Plus size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  Create First Pack
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

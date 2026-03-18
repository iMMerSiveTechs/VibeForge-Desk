import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Link,
  Trash2,
  X,
  Database,
  Wand2,
  Package,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePackTokens } from '@/lib/theme/PackTokensContext';
import StageSafeHeader from '@/components/StageSafeHeader';
import useVaultStore from '@/lib/state/vaultStore';
import type { VaultMeta, VaultFolder, VaultNote } from '@/lib/state/vaultStore';
import { useSubscription } from '@/lib/subscription/SubscriptionContext';
import { canUseVaultFeature } from '@/lib/subscription/gating';
import ProLockModal from '@/components/ProLockModal';

// ---------------------------------------------------------------------------
// FolderTreeItem
// ---------------------------------------------------------------------------

interface FolderTreeItemProps {
  folder: VaultFolder;
  depth: number;
  allFolders: VaultFolder[];
  notes: VaultNote[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onDeleteFolder: (id: string) => void;
}

function FolderTreeItem({
  folder,
  depth,
  allFolders,
  notes,
  selectedFolderId,
  onSelectFolder,
  onDeleteFolder,
}: FolderTreeItemProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const children = allFolders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const isSelected = selectedFolderId === folder.id;

  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectFolder(isSelected ? null : folder.id);
          if (children.length > 0) setExpanded(!expanded);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12 + depth * 16,
          backgroundColor: isSelected ? `${theme.spineAccent}20` : 'transparent',
          borderRadius: 8,
          marginVertical: 1,
        }}
      >
        <Pressable
          onPress={() => setExpanded(!expanded)}
          hitSlop={8}
          style={{ marginRight: 4 }}
        >
          {children.length > 0 ? (
            expanded ? (
              <ChevronDown size={14} color={theme.muted} />
            ) : (
              <ChevronRight size={14} color={theme.muted} />
            )
          ) : (
            <View style={{ width: 14 }} />
          )}
        </Pressable>
        <Folder size={14} color={isSelected ? theme.spineAccent : theme.muted} style={{ marginRight: 6 }} />
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            color: isSelected ? theme.textOnDesk : theme.muted,
            fontWeight: isSelected ? '600' : '400',
          }}
          numberOfLines={1}
        >
          {folder.name}
        </Text>
        <Text style={{ fontSize: 11, color: theme.muted, marginRight: 8 }}>
          {folderNotes.length}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDeleteFolder(folder.id);
          }}
          hitSlop={8}
        >
          <Trash2 size={12} color={theme.muted} />
        </Pressable>
      </Pressable>

      {expanded ? children.map((child) => (
        <FolderTreeItem
          key={child.id}
          folder={child}
          depth={depth + 1}
          allFolders={allFolders}
          notes={notes}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          onDeleteFolder={onDeleteFolder}
        />
      )) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// NoteListItem
// ---------------------------------------------------------------------------

interface NoteListItemProps {
  note: VaultNote;
  backlinksCount: number;
  onPress: () => void;
  onDelete: () => void;
}

function NoteListItem({ note, backlinksCount, onPress, onDelete }: NoteListItemProps) {
  const theme = useTheme();
  const tokens = usePackTokens();

  const updated = useMemo(() => {
    const d = new Date(note.updatedAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [note.updatedAt]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? `${theme.spineAccent}15` : theme.deskHl,
        borderRadius: tokens.cardRadius,
        padding: 14,
        marginBottom: 8,
        borderWidth: tokens.cardBorderWidth,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
      })}
    >
      <FileText size={16} color={theme.muted} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '600', color: theme.textOnDesk, marginBottom: 2 }}
          numberOfLines={1}
        >
          {note.title || 'Untitled'}
        </Text>
        <Text style={{ fontSize: 11, color: theme.muted }} numberOfLines={1}>
          {updated} · {note.path}
        </Text>
      </View>
      {note.parsedLinks.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: `${theme.ruleBlue}20`,
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginRight: 8,
          }}
        >
          <Link size={10} color={theme.ruleBlue} style={{ marginRight: 2 }} />
          <Text style={{ fontSize: 10, color: theme.ruleBlue, fontWeight: '600' }}>
            {note.parsedLinks.length}
          </Text>
        </View>
      )}
      {backlinksCount > 0 && (
        <View
          style={{
            backgroundColor: `${theme.brandGreen}20`,
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 10, color: theme.brandGreen, fontWeight: '600' }}>
            ← {backlinksCount}
          </Text>
        </View>
      )}
      <Pressable onPress={onDelete} hitSlop={8}>
        <Trash2 size={14} color={theme.muted} />
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// VaultPickerModal
// ---------------------------------------------------------------------------

interface VaultPickerModalProps {
  visible: boolean;
  vaults: VaultMeta[];
  activeVaultId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function VaultPickerModal({
  visible,
  vaults,
  activeVaultId,
  onSelect,
  onCreate,
  onClose,
  onDelete,
}: VaultPickerModalProps) {
  const theme = useTheme();
  const tokens = usePackTokens();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreate(trimmed);
    setNewName('');
    setCreating(false);
  };

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
          onPress={() => {/* prevent close */}}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Database size={18} color={theme.spineAccent} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textOnDesk, flex: 1 }}>
              Vaults
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={theme.muted} />
            </Pressable>
          </View>

          <FlatList
            data={vaults}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(item.id);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: activeVaultId === item.id ? `${theme.spineAccent}20` : theme.deskHl,
                  borderRadius: tokens.cardRadius,
                  marginBottom: 8,
                  borderWidth: activeVaultId === item.id ? 1 : 0,
                  borderColor: theme.spineAccent,
                }}
              >
                <Database size={16} color={activeVaultId === item.id ? theme.spineAccent : theme.muted} style={{ marginRight: 10 }} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: activeVaultId === item.id ? '700' : '400',
                    color: activeVaultId === item.id ? theme.textOnDesk : theme.muted,
                  }}
                >
                  {item.name}
                </Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onDelete(item.id);
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={14} color={theme.muted} />
                </Pressable>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ color: theme.muted, textAlign: 'center', paddingVertical: 20, fontSize: 14 }}>
                No vaults yet
              </Text>
            }
          />

          {creating ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Vault name..."
                placeholderTextColor={theme.muted}
                autoFocus
                style={{
                  backgroundColor: theme.deskHl,
                  borderRadius: tokens.cardRadius,
                  padding: 12,
                  color: theme.textOnDesk,
                  fontSize: 15,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                onSubmitEditing={handleCreate}
                returnKeyType="done"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setCreating(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: tokens.cardRadius,
                    backgroundColor: theme.deskHl,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.muted, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    borderRadius: tokens.cardRadius,
                    backgroundColor: theme.spineAccent,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Create</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setCreating(true)}
              style={{
                marginTop: 12,
                paddingVertical: 14,
                borderRadius: tokens.cardRadius,
                backgroundColor: `${theme.spineAccent}20`,
                borderWidth: 1,
                borderColor: `${theme.spineAccent}50`,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} color={theme.spineAccent} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.spineAccent, fontWeight: '700', fontSize: 14 }}>
                New Vault
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VaultOSScreen() {
  const theme = useTheme();
  const tokens = usePackTokens();
  const router = useRouter();
  const { isPro } = useSubscription();
  const [lockModal, setLockModal] = useState<{ visible: boolean; featureName: string }>({ visible: false, featureName: '' });

  // Store selectors
  const vaults = useVaultStore((s) => s.vaults);
  const foldersById = useVaultStore((s) => s.foldersById);
  const notesById = useVaultStore((s) => s.notesById);
  const backlinksIndex = useVaultStore((s) => s.backlinksIndex);
  const activeVaultId = useVaultStore((s) => s.activeVaultId);

  const createVault = useVaultStore((s) => s.createVault);
  const deleteVault = useVaultStore((s) => s.deleteVault);
  const setActiveVault = useVaultStore((s) => s.setActiveVault);
  const createFolder = useVaultStore((s) => s.createFolder);
  const deleteFolder = useVaultStore((s) => s.deleteFolder);
  const createNote = useVaultStore((s) => s.createNote);
  const deleteNote = useVaultStore((s) => s.deleteNote);

  // Local state
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const activeVault = useMemo(
    () => vaults.find((v) => v.id === activeVaultId) ?? null,
    [vaults, activeVaultId],
  );

  const vaultFolders = useMemo(
    () => activeVaultId
      ? Object.values(foldersById).filter((f) => f.vaultId === activeVaultId)
      : [],
    [foldersById, activeVaultId],
  );

  const rootFolders = useMemo(
    () => vaultFolders.filter((f) => f.parentId === null),
    [vaultFolders],
  );

  const vaultNotes = useMemo(
    () => activeVaultId
      ? Object.values(notesById).filter((n) => n.vaultId === activeVaultId)
      : [],
    [notesById, activeVaultId],
  );

  const filteredNotes = useMemo(
    () => selectedFolderId !== null
      ? vaultNotes.filter((n) => n.folderId === selectedFolderId)
      : vaultNotes.filter((n) => n.folderId === null),
    [vaultNotes, selectedFolderId],
  );

  const handleCreateNote = useCallback(() => {
    if (!activeVaultId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const note = createNote(activeVaultId, 'Untitled', selectedFolderId ?? undefined);
    router.push({ pathname: '/vault-note' as any, params: { noteId: note.id } });
  }, [activeVaultId, selectedFolderId, createNote, router]);

  const handleDeleteNote = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteNote(id);
  }, [deleteNote]);

  const handleDeleteFolder = useCallback((id: string) => {
    Alert.alert(
      'Delete Folder',
      'This will delete the folder and all notes inside it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteFolder(id);
            if (selectedFolderId === id) setSelectedFolderId(null);
          },
        },
      ],
    );
  }, [deleteFolder, selectedFolderId]);

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed || !activeVaultId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createFolder(activeVaultId, trimmed, undefined);
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const handleDeleteVault = (id: string) => {
    const vault = vaults.find((v) => v.id === id);
    Alert.alert(
      'Delete Vault',
      `Delete "${vault?.name ?? 'this vault'}"? All notes and folders will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteVault(id);
          },
        },
      ],
    );
  };

  // ------ Onboarding state ------
  if (!activeVaultId || vaults.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk }}>
        <StageSafeHeader
          title="Vault OS"
          onBack={() => router.back()}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View
            style={{
              backgroundColor: theme.deskHl,
              borderRadius: tokens.cardRadius,
              padding: 32,
              alignItems: 'center',
              borderWidth: tokens.cardBorderWidth,
              borderColor: theme.border,
              width: '100%',
            }}
          >
            <Database size={48} color={theme.spineAccent} style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: theme.textOnDesk,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Create your first Vault
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.muted,
                textAlign: 'center',
                marginBottom: 28,
                lineHeight: 20,
              }}
            >
              A Vault is your private workspace for notes, research, context packs, and linked knowledge.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                createVault('My Vault');
              }}
              style={{
                backgroundColor: theme.spineAccent,
                borderRadius: tokens.cardRadius,
                paddingVertical: 16,
                paddingHorizontal: 32,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                + Create Vault
              </Text>
            </Pressable>
          </View>
        </View>
        <VaultPickerModal
          visible={showVaultPicker}
          vaults={vaults}
          activeVaultId={activeVaultId}
          onSelect={setActiveVault}
          onCreate={createVault}
          onClose={() => setShowVaultPicker(false)}
          onDelete={handleDeleteVault}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.desk }}>
      <StageSafeHeader
        title="Vault OS"
        onBack={() => router.back()}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!canUseVaultFeature('generators', isPro)) {
                  setLockModal({ visible: true, featureName: 'Vault Generators' });
                  return;
                }
                router.push({ pathname: '/vault-generators' as any, params: { vaultId: activeVaultId } });
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${theme.spineAccent}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!canUseVaultFeature('generators', isPro) ? (
                <Lock size={14} color={theme.muted} />
              ) : (
                <Wand2 size={16} color={theme.spineAccent} />
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!canUseVaultFeature('context_packs', isPro)) {
                  setLockModal({ visible: true, featureName: 'Vault Context Packs' });
                  return;
                }
                router.push({ pathname: '/vault-context-packs' as any, params: { vaultId: activeVaultId } });
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${theme.spineAccent}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!canUseVaultFeature('context_packs', isPro) ? (
                <Lock size={14} color={theme.muted} />
              ) : (
                <Package size={16} color={theme.spineAccent} />
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleCreateNote();
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.spineAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color="#fff" />
            </Pressable>
          </View>
        }
      />

      {/* Vault name bar */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowVaultPicker(true);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <Database size={14} color={theme.spineAccent} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textOnDesk, flex: 1 }}>
          {activeVault?.name ?? 'Select Vault'}
        </Text>
        <Text style={{ fontSize: 11, color: theme.muted }}>
          {vaultNotes.length} notes
        </Text>
        <ChevronDown size={14} color={theme.muted} style={{ marginLeft: 4 }} />
      </Pressable>

      {/* Folder toggle */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowTree(!showTree);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: showTree ? 1 : 0,
          borderBottomColor: theme.border,
        }}
      >
        <Folder size={13} color={theme.muted} style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 12, color: theme.muted, flex: 1, fontWeight: '600', letterSpacing: 0.5 }}>
          FOLDERS
        </Text>
        {showTree ? (
          <ChevronDown size={14} color={theme.muted} />
        ) : (
          <ChevronRight size={14} color={theme.muted} />
        )}
      </Pressable>

      {/* Folder tree (collapsible) */}
      {showTree ? (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            paddingVertical: 8,
            paddingHorizontal: 8,
            maxHeight: 220,
          }}
        >
          {/* Root selector */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedFolderId(null);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: selectedFolderId === null ? `${theme.spineAccent}20` : 'transparent',
              borderRadius: 8,
              marginBottom: 4,
            }}
          >
            <FileText size={14} color={selectedFolderId === null ? theme.spineAccent : theme.muted} style={{ marginRight: 6 }} />
            <Text
              style={{
                fontSize: 13,
                color: selectedFolderId === null ? theme.textOnDesk : theme.muted,
                fontWeight: selectedFolderId === null ? '600' : '400',
                flex: 1,
              }}
            >
              Root
            </Text>
            <Text style={{ fontSize: 11, color: theme.muted }}>
              {vaultNotes.filter((n) => n.folderId === null).length}
            </Text>
          </Pressable>

          <ScrollView>
            {rootFolders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                depth={0}
                allFolders={vaultFolders}
                notes={vaultNotes}
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                onDeleteFolder={handleDeleteFolder}
              />
            ))}
          </ScrollView>

          {showNewFolderInput ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <TextInput
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name..."
                placeholderTextColor={theme.muted}
                autoFocus
                style={{
                  flex: 1,
                  backgroundColor: theme.deskHl,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  color: theme.textOnDesk,
                  fontSize: 13,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                onSubmitEditing={handleCreateFolder}
                returnKeyType="done"
              />
              <Pressable onPress={handleCreateFolder} style={{ padding: 6 }}>
                <Plus size={16} color={theme.spineAccent} />
              </Pressable>
              <Pressable onPress={() => setShowNewFolderInput(false)} style={{ padding: 6 }}>
                <X size={16} color={theme.muted} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowNewFolderInput(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12 }}
            >
              <Plus size={12} color={theme.muted} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: theme.muted }}>New Folder</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {/* Notes list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Section label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: theme.muted,
              letterSpacing: 1,
              textTransform: 'uppercase',
              flex: 1,
            }}
          >
            {selectedFolderId
              ? vaultFolders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder'
              : 'Root'}
          </Text>
          <Text style={{ fontSize: 11, color: theme.muted }}>{filteredNotes.length} notes</Text>
        </View>

        {filteredNotes.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.deskHl,
              borderRadius: tokens.cardRadius,
              padding: 28,
              alignItems: 'center',
              borderWidth: tokens.cardBorderWidth,
              borderColor: theme.border,
            }}
          >
            <FileText size={28} color={theme.muted} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.muted, fontSize: 14, textAlign: 'center' }}>
              No notes here yet.{'\n'}Tap + to create one.
            </Text>
          </View>
        ) : (
          filteredNotes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              backlinksCount={(backlinksIndex[note.id] ?? []).length}
              onPress={() =>
                router.push({ pathname: '/vault-note' as any, params: { noteId: note.id } })
              }
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))
        )}
      </ScrollView>

      <VaultPickerModal
        visible={showVaultPicker}
        vaults={vaults}
        activeVaultId={activeVaultId}
        onSelect={setActiveVault}
        onCreate={createVault}
        onClose={() => setShowVaultPicker(false)}
        onDelete={handleDeleteVault}
      />

      <ProLockModal
        visible={lockModal.visible}
        featureName={lockModal.featureName}
        onClose={() => setLockModal({ visible: false, featureName: '' })}
      />
    </View>
  );
}

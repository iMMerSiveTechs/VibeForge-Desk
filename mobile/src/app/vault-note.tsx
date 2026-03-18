import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Trash2,
  Eye,
  Edit3,
  Link2,
  GitBranch,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/ThemeContext';
import { usePackTokens } from '@/lib/theme/PackTokensContext';
import useVaultStore, { parseWikiLinks } from '@/lib/state/vaultStore';
import type { VaultNote } from '@/lib/state/vaultStore';
import MarkdownDisplay from 'react-native-markdown-display';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = 'WRITE' | 'PREVIEW' | 'BACKLINKS' | 'GRAPH';

// ---------------------------------------------------------------------------
// GraphView
// ---------------------------------------------------------------------------

interface GraphViewProps {
  currentNoteId: string;
  vaultId: string;
}

function GraphView({ currentNoteId, vaultId }: GraphViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const notesById = useVaultStore((s) => s.notesById);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 300,
    height: 300,
  });

  const vaultNotes = useMemo(
    () => Object.values(notesById).filter((n) => n.vaultId === vaultId),
    [notesById, vaultId],
  );

  // Build adjacency set
  const linkedSet = useMemo(() => {
    const set = new Set<string>();
    const current = notesById[currentNoteId];
    if (!current) return set;

    // Forward links from current note
    for (const link of current.parsedLinks) {
      const target = vaultNotes.find(
        (n) => n.title.toLowerCase() === link.toLowerCase(),
      );
      if (target) set.add(target.id);
    }

    // Backward links (notes that link TO current note)
    for (const note of vaultNotes) {
      if (note.id === currentNoteId) continue;
      for (const link of note.parsedLinks) {
        const target = vaultNotes.find(
          (n) => n.title.toLowerCase() === link.toLowerCase(),
        );
        if (target?.id === currentNoteId) set.add(note.id);
      }
    }

    return set;
  }, [currentNoteId, notesById, vaultNotes]);

  // Show max 29 connected notes + current
  const displayNotes = useMemo(() => {
    const connected = vaultNotes.filter((n) => n.id !== currentNoteId && linkedSet.has(n.id));
    const unconnected = vaultNotes.filter((n) => n.id !== currentNoteId && !linkedSet.has(n.id));
    const combined = [...connected, ...unconnected];
    return combined.slice(0, 29);
  }, [vaultNotes, currentNoteId, linkedSet]);

  const { width, height } = dimensions;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const nodePositions = useMemo<Record<string, { x: number; y: number }>>(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    positions[currentNoteId] = { x: cx, y: cy };
    const total = displayNotes.length;
    displayNotes.forEach((note, i) => {
      const angle = (i / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
      positions[note.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return positions;
  }, [displayNotes, currentNoteId, cx, cy, radius]);

  // Build edges
  const edges = useMemo<Array<{ from: string; to: string }>>(() => {
    const edgeList: Array<{ from: string; to: string }> = [];
    const allDisplayIds = new Set([currentNoteId, ...displayNotes.map((n) => n.id)]);

    const buildEdges = (noteId: string) => {
      const note = notesById[noteId];
      if (!note) return;
      for (const link of note.parsedLinks) {
        const target = vaultNotes.find(
          (n) => n.title.toLowerCase() === link.toLowerCase(),
        );
        if (target && allDisplayIds.has(target.id)) {
          const key1 = `${noteId}--${target.id}`;
          const key2 = `${target.id}--${noteId}`;
          const alreadyExists = edgeList.some(
            (e) => `${e.from}--${e.to}` === key1 || `${e.from}--${e.to}` === key2,
          );
          if (!alreadyExists) {
            edgeList.push({ from: noteId, to: target.id });
          }
        }
      }
    };

    buildEdges(currentNoteId);
    for (const note of displayNotes) buildEdges(note.id);
    return edgeList;
  }, [currentNoteId, displayNotes, notesById, vaultNotes]);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setDimensions({ width: w, height: h });
      }}
    >
      <Svg width={width} height={height}>
        {/* Draw edges */}
        {edges.map((edge, i) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;
          return (
            <Line
              key={`edge-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={theme.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Draw other nodes */}
        {displayNotes.map((note) => {
          const pos = nodePositions[note.id];
          if (!pos) return null;
          const isLinked = linkedSet.has(note.id);
          return (
            <G key={note.id} onPress={() => router.push({ pathname: '/vault-note' as any, params: { noteId: note.id } })}>
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill={theme.deskHl}
                stroke={isLinked ? theme.spineAccent : theme.border}
                strokeWidth={isLinked ? 1.5 : 1}
              />
              <SvgText
                x={pos.x}
                y={pos.y + 22}
                fontSize={9}
                fill={theme.muted}
                textAnchor="middle"
              >
                {note.title.slice(0, 12)}
              </SvgText>
            </G>
          );
        })}

        {/* Draw current note (center) */}
        {nodePositions[currentNoteId] != null && (
          <G>
            <Circle
              cx={nodePositions[currentNoteId].x}
              cy={nodePositions[currentNoteId].y}
              r={18}
              fill={`${theme.spineAccent}30`}
              stroke={theme.spineAccent}
              strokeWidth={2}
            />
            <SvgText
              x={nodePositions[currentNoteId].x}
              y={nodePositions[currentNoteId].y + 28}
              fontSize={9}
              fill={theme.textOnDesk}
              textAnchor="middle"
              fontWeight="bold"
            >
              {(notesById[currentNoteId]?.title ?? '').slice(0, 12)}
            </SvgText>
          </G>
        )}
      </Svg>

      {displayNotes.length === 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <GitBranch size={32} color={theme.border} />
          <Text style={{ color: theme.muted, fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            No connections yet.{'\n'}Add wiki-links like [[Note Title]] to connect notes.
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VaultNoteScreen() {
  const theme = useTheme();
  const tokens = usePackTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();

  const notesById = useVaultStore((s) => s.notesById);
  const backlinksIndex = useVaultStore((s) => s.backlinksIndex);
  const updateNote = useVaultStore((s) => s.updateNote);
  const deleteNote = useVaultStore((s) => s.deleteNote);
  const rebuildBacklinks = useVaultStore((s) => s.rebuildBacklinks);

  const note = notesById[noteId ?? ''] ?? null;

  // Local edit state
  const [title, setTitle] = useState<string>(note?.title ?? '');
  const [content, setContent] = useState<string>(note?.content ?? '');
  const [activeTab, setActiveTab] = useState<TabKey>('WRITE');

  // Debounce refs
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state if store note changes externally
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [noteId]); // only on noteId change, not every store update

  const saveContent = useCallback(
    (newContent: string) => {
      if (!noteId) return;
      updateNote(noteId, {
        content: newContent,
        parsedLinks: parseWikiLinks(newContent),
      });
      rebuildBacklinks(note?.vaultId ?? '');
    },
    [noteId, updateNote, rebuildBacklinks, note?.vaultId],
  );

  const saveTitle = useCallback(
    (newTitle: string) => {
      if (!noteId) return;
      updateNote(noteId, { title: newTitle });
    },
    [noteId, updateNote],
  );

  const handleContentChange = (text: string) => {
    setContent(text);
    if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current);
    contentDebounceRef.current = setTimeout(() => saveContent(text), 800);
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => saveTitle(text), 600);
  };

  const handleTitleBlur = () => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    saveTitle(title);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      `Delete "${title || 'Untitled'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteNote(noteId ?? '');
            router.back();
          },
        },
      ],
    );
  };

  // Backlinks data
  const backlinkNoteIds = useMemo(
    () => backlinksIndex[noteId ?? ''] ?? [],
    [backlinksIndex, noteId],
  );

  const backlinkNotes = useMemo<VaultNote[]>(
    () =>
      backlinkNoteIds
        .map((id) => notesById[id])
        .filter((n): n is VaultNote => n !== undefined),
    [backlinkNoteIds, notesById],
  );

  // Markdown preview: preprocess wiki-links
  const previewContent = useMemo(() => {
    return content.replace(/\[\[([^\]]+)\]\]/g, (_, target: string) => `[${target}](wiki://${encodeURIComponent(target)})`);
  }, [content]);

  const handleLinkPress = (url: string): boolean => {
    if (url.startsWith('wiki://')) {
      const target = decodeURIComponent(url.slice('wiki://'.length));
      const found = note
        ? Object.values(notesById).find(
            (n) => n.vaultId === note.vaultId && n.title.toLowerCase() === target.toLowerCase(),
          )
        : null;
      if (found) {
        router.push({ pathname: '/vault-note' as any, params: { noteId: found.id } });
      } else {
        Alert.alert(
          `"${target}" not found`,
          'Would you like to create a note with this title?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Note',
              onPress: () => {
                // Navigate back to vault-os to handle creation there, or handle inline
                Alert.alert('Create from vault-os', 'Go to Vault OS and create a note named: ' + target);
              },
            },
          ],
        );
      }
      return false;
    }
    return false;
  };

  if (!note) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.desk, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.muted }}>Note not found.</Text>
      </View>
    );
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'WRITE', label: 'WRITE', icon: <Edit3 size={13} color={activeTab === 'WRITE' ? theme.spineAccent : theme.muted} /> },
    { key: 'PREVIEW', label: 'PREVIEW', icon: <Eye size={13} color={activeTab === 'PREVIEW' ? theme.spineAccent : theme.muted} /> },
    { key: 'BACKLINKS', label: 'BACKLINKS', icon: <Link2 size={13} color={activeTab === 'BACKLINKS' ? theme.spineAccent : theme.muted} /> },
    { key: 'GRAPH', label: 'GRAPH', icon: <GitBranch size={13} color={activeTab === 'GRAPH' ? theme.spineAccent : theme.muted} /> },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.desk }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + (Platform.OS === 'ios' ? 20 : 0) + 8,
          paddingBottom: 8,
          paddingHorizontal: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.desk,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          {/* Back */}
          <Pressable
            onPress={() => {
              if (contentDebounceRef.current) {
                clearTimeout(contentDebounceRef.current);
                saveContent(content);
              }
              if (titleDebounceRef.current) {
                clearTimeout(titleDebounceRef.current);
                saveTitle(title);
              }
              router.back();
            }}
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}
          >
            <ChevronLeft size={24} color={theme.textOnDesk} />
          </Pressable>

          {/* Editable title */}
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Untitled"
            placeholderTextColor={theme.muted}
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: '700',
              color: theme.textOnDesk,
              fontFamily: 'serif',
              paddingVertical: 0,
            }}
            returnKeyType="done"
          />

          {/* Delete */}
          <Pressable
            onPress={handleDelete}
            hitSlop={10}
            style={{ marginLeft: 8 }}
          >
            <Trash2 size={18} color={theme.muted} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: activeTab === tab.key ? `${theme.spineAccent}20` : 'transparent',
                borderWidth: activeTab === tab.key ? 1 : 0,
                borderColor: activeTab === tab.key ? `${theme.spineAccent}50` : 'transparent',
              }}
            >
              {tab.icon}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  color: activeTab === tab.key ? theme.spineAccent : theme.muted,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content area */}
      {activeTab === 'WRITE' && (
        <TextInput
          value={content}
          onChangeText={handleContentChange}
          multiline
          placeholder="Start writing in markdown... Use [[Note Title]] to link notes."
          placeholderTextColor={theme.muted}
          style={{
            flex: 1,
            padding: 16,
            color: theme.textOnDesk,
            fontSize: 14,
            lineHeight: 22,
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
            textAlignVertical: 'top',
          }}
          scrollEnabled
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      )}

      {activeTab === 'PREVIEW' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          <MarkdownDisplay
            onLinkPress={handleLinkPress}
            style={{
              body: {
                color: theme.textOnDesk,
                fontSize: 14,
                lineHeight: 22,
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              },
              heading1: {
                color: theme.textOnDesk,
                fontWeight: '700',
                fontSize: 22,
                marginBottom: 12,
                marginTop: 8,
              },
              heading2: {
                color: theme.textOnDesk,
                fontWeight: '700',
                fontSize: 18,
                marginBottom: 8,
                marginTop: 12,
              },
              heading3: {
                color: theme.textOnDesk,
                fontWeight: '600',
                fontSize: 16,
                marginBottom: 6,
                marginTop: 10,
              },
              code_inline: {
                backgroundColor: theme.deskHl,
                color: theme.spineAccent,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                fontSize: 13,
                paddingHorizontal: 4,
                borderRadius: 4,
              },
              fence: {
                backgroundColor: theme.deskHl,
                borderRadius: 8,
                padding: 12,
              },
              code_block: {
                backgroundColor: theme.deskHl,
                borderRadius: 8,
                padding: 12,
                color: theme.textOnDesk,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                fontSize: 13,
              },
              blockquote: {
                backgroundColor: `${theme.ruleBlue}15`,
                borderLeftColor: theme.ruleBlue,
                borderLeftWidth: 3,
                paddingLeft: 12,
                paddingVertical: 4,
                borderRadius: 4,
              },
              link: {
                color: theme.spineAccent,
                textDecorationLine: 'underline' as const,
              },
              bullet_list_icon: {
                color: theme.spineAccent,
              },
              hr: {
                backgroundColor: theme.border,
                height: 1,
              },
              table: {
                borderColor: theme.border,
              },
              th: {
                backgroundColor: theme.deskHl,
                color: theme.textOnDesk,
              },
              td: {
                color: theme.textOnDesk,
              },
            }}
          >
            {previewContent}
          </MarkdownDisplay>
        </ScrollView>
      )}

      {activeTab === 'BACKLINKS' && (
        <View style={{ flex: 1 }}>
          {backlinkNotes.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 32,
              }}
            >
              <Link2 size={32} color={theme.border} />
              <Text
                style={{
                  color: theme.muted,
                  fontSize: 14,
                  marginTop: 12,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                No notes link here yet.{'\n'}Add [[{title}]] to another note to create a backlink.
              </Text>
            </View>
          ) : (
            <FlatList
              data={backlinkNotes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListHeaderComponent={
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: theme.muted,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  {backlinkNotes.length} note{backlinkNotes.length !== 1 ? 's' : ''} link here
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/vault-note' as any, params: { noteId: item.id } });
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
                  <Link2 size={14} color={theme.ruleBlue} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.textOnDesk,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.muted }} numberOfLines={1}>
                      {item.path}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {activeTab === 'GRAPH' && (
        <GraphView currentNoteId={noteId ?? ''} vaultId={note.vaultId} />
      )}
    </KeyboardAvoidingView>
  );
}

import React, { useState, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Image, Modal, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Plus, ChevronLeft, FastForward, Check, Square, CheckSquare, Clock, Camera, Image as ImageIcon, Trash2, MapPin } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme/ThemeContext';
import useDeskStore from '@/lib/state/store';
import { createItem, uid, taskProgress, fmtCreatedAt } from '@/lib/state/store';
import { KINDS, KIND_KEYS, type ItemKind } from '@/lib/constants';
import type { VFItem, VFPhoto, TaskRow, TaskData, StickyMeta, WorkSession, PinboardPin } from '@/lib/state/store';
import { safeDismiss } from '@/lib/safeClose';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// On iPad Stage Manager, window controls sit at ~28-32px top-left. Add offset so buttons don't overlap.
const STAGE_OFFSET = Platform.OS === 'ios' ? 20 : 0;

// ---------------------------------------------------------------------------
// Photo URI persistence helper
// ---------------------------------------------------------------------------

/** Copy a picker URI into app-local storage so it survives iOS temp-dir clears. */
async function persistPhotoUri(sourceUri: string): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}vf_photos/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = sourceUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const dest = `${dir}${uid()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}

// ---------------------------------------------------------------------------
// Photo Viewer Modal
// ---------------------------------------------------------------------------

function PhotoViewerModal({
  photo,
  visible,
  onClose,
  onDelete,
}: {
  photo: VFPhoto | null;
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();

  if (!photo) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.92)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Top bar */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <X size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(
                'Remove Photo',
                'Are you sure you want to remove this photo?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: onDelete,
                  },
                ],
              );
            }}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255,60,48,0.25)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Trash2 size={18} color={theme.danger} />
          </Pressable>
        </View>

        {/* Photo */}
        <Image
          source={{ uri: photo.uri }}
          style={{
            width: SCREEN_WIDTH - 32,
            height: SCREEN_HEIGHT * 0.6,
            borderRadius: 12,
          }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Photo Strip
// ---------------------------------------------------------------------------

function PhotoStrip({
  photos,
  onAddPhoto,
  onViewPhoto,
}: {
  photos: VFPhoto[];
  onAddPhoto: () => void;
  onViewPhoto: (photo: VFPhoto) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ marginTop: 12, marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 2,
          color: theme.ink,
          opacity: 0.5,
          marginBottom: 8,
        }}
      >
        PHOTOS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {photos.map((photo) => (
          <Pressable
            key={photo.id}
            onPress={() => onViewPhoto(photo)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.ink + '15',
            }}
          >
            <Image
              source={{ uri: photo.uri }}
              style={{ width: 60, height: 60 }}
              resizeMode="cover"
            />
          </Pressable>
        ))}
        <Pressable
          onPress={onAddPhoto}
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.ink + '25',
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.ink + '08',
          }}
        >
          <Plus size={20} color={theme.ink + '55'} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tag editor component
// ---------------------------------------------------------------------------

function TagEditor({
  tags,
  onAdd,
  onRemove,
  textColor,
  accentColor,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  textColor: string;
  accentColor: string;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
    }
    setInput('');
  };

  return (
    <View className="flex-row flex-wrap items-center" style={{ gap: 6, flexGrow: 0 }}>
      {tags.map((tag, i) => (
        <View
          key={`${tag}-${i}`}
          className="flex-row items-center"
          style={{
            backgroundColor: accentColor + '22',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: accentColor }}>{tag}</Text>
          <Pressable onPress={() => onRemove(i)} hitSlop={10} style={{ marginLeft: 4 }}>
            <X size={12} color={accentColor} />
          </Pressable>
        </View>
      ))}
      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmitEditing={handleSubmit}
        placeholder="+ tag"
        placeholderTextColor={textColor + '66'}
        returnKeyType="done"
        style={{
          fontSize: 12,
          color: textColor,
          paddingHorizontal: 6,
          paddingVertical: 4,
          minWidth: 50,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ruled paper decoration
// ---------------------------------------------------------------------------

function RuledPaperBg({ ruleColor, marginColor }: { ruleColor: string; marginColor: string }) {
  const lines = Array.from({ length: 30 }, (_, i) => i);
  return (
    <View className="absolute inset-0" style={{ opacity: 0.25 }}>
      {lines.map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: 56 + i * 26,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: ruleColor,
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 36,
          width: 1,
          backgroundColor: marginColor,
          opacity: 0.6,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Plan / Note Editor
// ---------------------------------------------------------------------------

function PlanNoteEditor({
  item,
  setItem,
  onAddPhoto,
  onViewPhoto,
}: {
  item: VFItem;
  setItem: React.Dispatch<React.SetStateAction<VFItem>>;
  onAddPhoto: () => void;
  onViewPhoto: (photo: VFPhoto) => void;
}) {
  const theme = useTheme();
  const addWorkSession = useDeskStore((s) => s.addWorkSession);
  const [sessionNote, setSessionNote] = useState('');

  const sessions = item.workSessions ?? [];
  const isPlan = item.kind === 'plan';

  const handleLogSession = () => {
    if (!item.id) return;
    addWorkSession(item.id, sessionNote.trim() || undefined);
    // Also update local state so the UI refreshes immediately
    const newSession: WorkSession = {
      ts: new Date().toISOString(),
      note: sessionNote.trim() || undefined,
    };
    setItem((prev) => ({
      ...prev,
      workSessions: [...(prev.workSessions ?? []), newSession],
    }));
    setSessionNote('');
  };

  const formatSessionTime = (ts: string): string => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.paper }}>
      <RuledPaperBg ruleColor={theme.ruleBlue} marginColor={theme.marginRed} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, paddingLeft: 44 }}
        keyboardDismissMode="interactive"
      >
        <TextInput
          value={item.title}
          onChangeText={(text) => setItem((prev) => ({ ...prev, title: text }))}
          placeholder="Title"
          placeholderTextColor={theme.ink + '55'}
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: theme.ink,
            fontFamily: 'serif',
            marginBottom: 4,
          }}
        />
        {/* Creation timestamp */}
        <Text style={{
          fontSize: 12,
          color: theme.muted,
          marginBottom: 12,
          fontStyle: 'italic',
        }}>
          {fmtCreatedAt(item.createdAt)}
        </Text>
        <View style={{ marginBottom: 12 }}>
          <TagEditor
            tags={item.tags}
            onAdd={(tag) => setItem((prev) => ({ ...prev, tags: [...prev.tags, tag] }))}
            onRemove={(i) =>
              setItem((prev) => ({
                ...prev,
                tags: prev.tags.filter((_, idx) => idx !== i),
              }))
            }
            textColor={theme.ink}
            accentColor={theme.ruleBlue}
          />
        </View>
        <TextInput
          value={item.body}
          onChangeText={(text) => setItem((prev) => ({ ...prev, body: text }))}
          placeholder="Start writing..."
          placeholderTextColor={theme.ink + '44'}
          multiline
          textAlignVertical="top"
          style={{
            fontSize: 15,
            color: theme.ink,
            lineHeight: 26,
            minHeight: 500,
          }}
        />

        {/* Photo strip */}
        <PhotoStrip
          photos={item.photos}
          onAddPhoto={onAddPhoto}
          onViewPhoto={onViewPhoto}
        />

        {/* Work Sessions - plan items only */}
        {isPlan ? (
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                letterSpacing: 2,
                color: theme.ink,
                opacity: 0.5,
                marginBottom: 12,
              }}
            >
              WORK SESSIONS
            </Text>

            {/* Log Session input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                gap: 8,
              }}
            >
              <TextInput
                value={sessionNote}
                onChangeText={setSessionNote}
                placeholder="Session note (optional)"
                placeholderTextColor={theme.ink + '44'}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: theme.ink,
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              />
              <Pressable
                onPress={handleLogSession}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.ruleBlue + '22',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Clock size={14} color={theme.ruleBlue} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: theme.ruleBlue,
                    marginLeft: 4,
                  }}
                >
                  Log
                </Text>
              </Pressable>
            </View>

            {/* Timeline */}
            {sessions.length === 0 ? (
              <Text style={{ fontSize: 13, color: theme.ink, opacity: 0.4 }}>
                No sessions logged yet.
              </Text>
            ) : (
              <View>
                {[...sessions].reverse().map((session, idx) => (
                  <View
                    key={`${session.ts}-${idx}`}
                    style={{
                      flexDirection: 'row',
                      marginBottom: 12,
                    }}
                  >
                    {/* Timeline dot and line */}
                    <View style={{ alignItems: 'center', marginRight: 12, width: 16 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.ruleBlue,
                          marginTop: 4,
                        }}
                      />
                      {idx < sessions.length - 1 ? (
                        <View
                          style={{
                            width: 1,
                            flex: 1,
                            backgroundColor: theme.ruleBlue,
                            opacity: 0.3,
                            marginTop: 4,
                          }}
                        />
                      ) : null}
                    </View>
                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: theme.ink,
                          opacity: 0.6,
                        }}
                      >
                        {formatSessionTime(session.ts)}
                      </Text>
                      {session.note ? (
                        <Text
                          style={{
                            fontSize: 14,
                            color: theme.ink,
                            marginTop: 2,
                          }}
                        >
                          {session.note}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sticky Editor
// ---------------------------------------------------------------------------

function StickyEditor({
  item,
  setItem,
  onAddPhoto,
  onViewPhoto,
}: {
  item: VFItem;
  setItem: React.Dispatch<React.SetStateAction<VFItem>>;
  onAddPhoto: () => void;
  onViewPhoto: (photo: VFPhoto) => void;
}) {
  const theme = useTheme();
  const stickyColor =
    item.stickyMeta?.color === 'green' ? theme.stickyGreen : theme.stickyYellow;

  const setColor = (color: 'yellow' | 'green') => {
    setItem((prev) => ({
      ...prev,
      stickyMeta: { ...prev.stickyMeta, color } as StickyMeta,
    }));
  };

  return (
    <View className="flex-1" style={{ backgroundColor: stickyColor }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        keyboardDismissMode="interactive"
      >
        <TextInput
          value={item.title}
          onChangeText={(text) => setItem((prev) => ({ ...prev, title: text }))}
          placeholder="Title"
          placeholderTextColor={theme.ink + '55'}
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: theme.ink,
            marginBottom: 4,
          }}
        />
        {/* Creation timestamp */}
        <Text style={{
          fontSize: 11,
          color: theme.ink,
          marginBottom: 8,
          fontStyle: 'italic',
          opacity: 0.6,
        }}>
          {fmtCreatedAt(item.createdAt)}
        </Text>
        <View style={{ marginBottom: 12 }}>
          <TagEditor
            tags={item.tags}
            onAdd={(tag) => setItem((prev) => ({ ...prev, tags: [...prev.tags, tag] }))}
            onRemove={(i) =>
              setItem((prev) => ({
                ...prev,
                tags: prev.tags.filter((_, idx) => idx !== i),
              }))
            }
            textColor={theme.ink}
            accentColor={theme.ink}
          />
        </View>
        <TextInput
          value={item.body}
          onChangeText={(text) => setItem((prev) => ({ ...prev, body: text }))}
          placeholder="Quick note..."
          placeholderTextColor={theme.ink + '44'}
          multiline
          textAlignVertical="top"
          style={{
            fontSize: 15,
            color: theme.ink,
            lineHeight: 24,
            minHeight: 400,
          }}
        />

        {/* Photo strip */}
        <PhotoStrip
          photos={item.photos}
          onAddPhoto={onAddPhoto}
          onViewPhoto={onViewPhoto}
        />
      </ScrollView>

      {/* Color toggle */}
      <View
        className="flex-row items-center justify-center"
        style={{ paddingBottom: 20, gap: 16 }}
      >
        <Pressable
          onPress={() => setColor('yellow')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.stickyYellow,
            borderWidth: item.stickyMeta?.color !== 'green' ? 3 : 0,
            borderColor: theme.ink,
          }}
        />
        <Pressable
          onPress={() => setColor('green')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.stickyGreen,
            borderWidth: item.stickyMeta?.color === 'green' ? 3 : 0,
            borderColor: theme.ink,
          }}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Task Planner Editor
// ---------------------------------------------------------------------------

function TaskEditor({
  item,
  setItem,
  onCarryForward,
  onAddPhoto,
  onViewPhoto,
}: {
  item: VFItem;
  setItem: React.Dispatch<React.SetStateAction<VFItem>>;
  onCarryForward: () => void;
  onAddPhoto: () => void;
  onViewPhoto: (photo: VFPhoto) => void;
}) {
  const theme = useTheme();
  const td = item.taskData ?? {
    date: new Date().toISOString().slice(0, 10),
    tasks: [],
    important: '',
    tomorrow: '',
    gratitude: '',
    notes: '',
  };

  const progress = taskProgress(item);

  const updateTaskData = (updates: Partial<TaskData>) => {
    setItem((prev) => ({
      ...prev,
      taskData: { ...(prev.taskData ?? td), ...updates },
    }));
  };

  const toggleTask = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tasks = td.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t,
    );
    updateTaskData({ tasks });
  };

  const updateTaskText = (taskId: string, text: string) => {
    const tasks = td.tasks.map((t) =>
      t.id === taskId ? { ...t, text } : t,
    );
    updateTaskData({ tasks });
  };

  const addTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tasks = [...td.tasks, { id: uid(), text: '', done: false }];
    updateTaskData({ tasks });
  };

  const removeTask = (taskId: string) => {
    if (td.tasks.length <= 1) return;
    const tasks = td.tasks.filter((t) => t.id !== taskId);
    updateTaskData({ tasks });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.plannerPaper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
        keyboardDismissMode="interactive"
      >
        {/* Date header */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 4,
          }}
        >
          TODAY
        </Text>
        <TextInput
          value={td.date}
          onChangeText={(text) => updateTaskData({ date: text })}
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.ink,
            marginBottom: 12,
          }}
        />

        {/* Title */}
        <TextInput
          value={item.title}
          onChangeText={(text) => setItem((prev) => ({ ...prev, title: text }))}
          placeholder="Log title (optional)"
          placeholderTextColor={theme.ink + '44'}
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.ink,
            marginBottom: 4,
          }}
        />

        {/* Creation timestamp */}
        <Text style={{
          fontSize: 11,
          color: theme.muted,
          marginBottom: 12,
          fontStyle: 'italic',
        }}>
          Created {fmtCreatedAt(item.createdAt)}
        </Text>

        {/* Progress bar */}
        {td.tasks.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: 4 }}
            >
              <Text style={{ fontSize: 12, color: theme.ink, opacity: 0.5 }}>
                Progress
              </Text>
              <Text style={{ fontSize: 12, color: theme.ink, opacity: 0.5 }}>
                {progress.done}/{progress.total}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.plannerGreen,
                  width: `${progress.pct}%`,
                }}
              />
            </View>
          </View>
        ) : null}

        {/* TASKS section */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 8,
          }}
        >
          TASKS
        </Text>

        {td.tasks.map((task) => (
          <View
            key={task.id}
            className="flex-row items-center"
            style={{ marginBottom: 8 }}
          >
            <Pressable onPress={() => toggleTask(task.id)} hitSlop={10}>
              {task.done ? (
                <CheckSquare size={20} color={theme.plannerGreen} />
              ) : (
                <Square size={20} color={theme.ink + '55'} />
              )}
            </Pressable>
            <TextInput
              value={task.text}
              onChangeText={(text) => updateTaskText(task.id, text)}
              placeholder="Task..."
              placeholderTextColor={theme.ink + '33'}
              style={{
                flex: 1,
                fontSize: 15,
                color: theme.ink,
                marginLeft: 10,
                textDecorationLine: task.done ? 'line-through' : 'none',
                opacity: task.done ? 0.5 : 1,
              }}
            />
            {td.tasks.length > 1 ? (
              <Pressable onPress={() => removeTask(task.id)} hitSlop={10}>
                <X size={16} color={theme.ink + '44'} />
              </Pressable>
            ) : null}
          </View>
        ))}

        <Pressable
          onPress={addTask}
          className="flex-row items-center"
          style={{ marginBottom: 24, paddingVertical: 6 }}
        >
          <Plus size={16} color={theme.plannerGreen} />
          <Text
            style={{
              fontSize: 14,
              color: theme.plannerGreen,
              fontWeight: '600',
              marginLeft: 6,
            }}
          >
            Add Task
          </Text>
        </Pressable>

        {/* IMPORTANT */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 6,
          }}
        >
          IMPORTANT
        </Text>
        <TextInput
          value={td.important}
          onChangeText={(text) => updateTaskData({ important: text })}
          placeholder="What matters most today..."
          placeholderTextColor={theme.ink + '33'}
          multiline
          style={{
            fontSize: 14,
            color: theme.ink,
            lineHeight: 22,
            minHeight: 60,
            marginBottom: 20,
          }}
        />

        {/* TOMORROW */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 6,
          }}
        >
          TOMORROW
        </Text>
        <TextInput
          value={td.tomorrow}
          onChangeText={(text) => updateTaskData({ tomorrow: text })}
          placeholder="Plan for tomorrow..."
          placeholderTextColor={theme.ink + '33'}
          multiline
          style={{
            fontSize: 14,
            color: theme.ink,
            lineHeight: 22,
            minHeight: 60,
            marginBottom: 20,
          }}
        />

        {/* GRATITUDE */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 6,
          }}
        >
          {"I'M GRATEFUL FOR..."}
        </Text>
        <TextInput
          value={td.gratitude}
          onChangeText={(text) => updateTaskData({ gratitude: text })}
          placeholder="What are you grateful for?"
          placeholderTextColor={theme.ink + '33'}
          multiline
          style={{
            fontSize: 14,
            color: theme.ink,
            lineHeight: 22,
            minHeight: 60,
            marginBottom: 20,
          }}
        />

        {/* NOTES */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            letterSpacing: 2,
            color: theme.ink,
            opacity: 0.5,
            marginBottom: 6,
          }}
        >
          NOTES
        </Text>
        <TextInput
          value={td.notes}
          onChangeText={(text) => updateTaskData({ notes: text })}
          placeholder="Additional notes..."
          placeholderTextColor={theme.ink + '33'}
          multiline
          style={{
            fontSize: 14,
            color: theme.ink,
            lineHeight: 22,
            minHeight: 60,
            marginBottom: 20,
          }}
        />

        {/* Photo strip */}
        <PhotoStrip
          photos={item.photos}
          onAddPhoto={onAddPhoto}
          onViewPhoto={onViewPhoto}
        />

        {/* Tags */}
        <View style={{ marginBottom: 20 }}>
          <TagEditor
            tags={item.tags}
            onAdd={(tag) => setItem((prev) => ({ ...prev, tags: [...prev.tags, tag] }))}
            onRemove={(i) =>
              setItem((prev) => ({
                ...prev,
                tags: prev.tags.filter((_, idx) => idx !== i),
              }))
            }
            textColor={theme.ink}
            accentColor={theme.plannerGreen}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Editor Screen
// ---------------------------------------------------------------------------

export default function EditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { itemId, isNew } = useLocalSearchParams<{ itemId: string; isNew?: string }>();

  const storeItem = useDeskStore((s) => (itemId ? s.itemsById[itemId] : undefined));
  const upsertItem = useDeskStore((s) => s.upsertItem);
  const addWorkSession = useDeskStore((s) => s.addWorkSession);
  const pins = useDeskStore((s) => s.pinboard.pins);
  const addPin = useDeskStore((s) => s.addPin);
  const removePin = useDeskStore((s) => s.removePin);
  const deleteItem = useDeskStore((s) => s.deleteItem);

  const [item, setItem] = useState<VFItem>(() => {
    if (storeItem) return { ...storeItem };
    // Fallback: should not happen if navigated correctly
    return createItem('note');
  });

  // Photo viewer state
  const [viewingPhoto, setViewingPhoto] = useState<VFPhoto | null>(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  // Pin to board state
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const existingPin = useMemo(
    () => pins.find((p) => p.itemId === (itemId ?? '')),
    [pins, itemId],
  );
  const isPinnedToBoard = existingPin != null;

  const handlePinToBoard = () => {
    if (isPinnedToBoard) {
      removePin(existingPin.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPinFeedback('Unpinned from board');
    } else {
      const newPin: PinboardPin = {
        id: uid(),
        itemId: itemId ?? item.id,
        x: 100,
        y: 100,
        w: 160,
        h: 100,
        z: pins.length + 1,
      };
      addPin(newPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPinFeedback('Pinned to board!');
    }
    setTimeout(() => setPinFeedback(null), 2000);
  };

  // Track original content to detect changes for auto work-session logging
  const originalBodyRef = useRef(storeItem?.body ?? '');
  const originalTitleRef = useRef(storeItem?.title ?? '');

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const localUri = await persistPhotoUri(asset.uri);
            const photo: VFPhoto = {
              id: uid(),
              uri: localUri,
              addedAt: new Date().toISOString(),
              source: 'camera',
            };
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setItem((prev) => ({
              ...prev,
              photos: [...prev.photos, photo],
            }));
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const localUri = await persistPhotoUri(asset.uri);
            const photo: VFPhoto = {
              id: uid(),
              uri: localUri,
              addedAt: new Date().toISOString(),
              source: 'library',
            };
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setItem((prev) => ({
              ...prev,
              photos: [...prev.photos, photo],
            }));
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleViewPhoto = (photo: VFPhoto) => {
    setViewingPhoto(photo);
    setPhotoViewerVisible(true);
  };

  const handleDeletePhoto = () => {
    if (!viewingPhoto) return;
    const photoId = viewingPhoto.id;
    setItem((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotoViewerVisible(false);
    setViewingPhoto(null);
  };

  const handleSave = () => {
    let toSave = { ...item };
    if (toSave.kind === 'task' && !toSave.title.trim()) {
      toSave = { ...toSave, title: `Log: ${toSave.taskData?.date ?? new Date().toISOString().slice(0, 10)}` };
    }
    upsertItem(toSave);

    // Auto-log work session for plan items if content changed
    if (toSave.kind === 'plan') {
      const bodyChanged = toSave.body !== originalBodyRef.current;
      const titleChanged = toSave.title !== originalTitleRef.current;
      if (bodyChanged || titleChanged) {
        addWorkSession(toSave.id);
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    safeDismiss(router);
  };

  const handleCancel = () => {
    if (isNew === '1') {
      // Check if effectively empty/untouched
      const titleEmpty = !item.title.trim();
      const bodyEmpty = !item.body.trim();
      const noPhotos = item.photos.length === 0;
      const noTags = item.tags.length === 0;
      // For task items: check if task rows are all empty too
      const taskEmpty = item.kind === 'task'
        ? (item.taskData?.tasks ?? []).every((t) => !t.text.trim())
          && !item.taskData?.important?.trim()
          && !item.taskData?.tomorrow?.trim()
          && !item.taskData?.gratitude?.trim()
          && !item.taskData?.notes?.trim()
        : true;

      const isEmpty = titleEmpty && bodyEmpty && noPhotos && noTags && taskEmpty;

      if (isEmpty) {
        // Delete silently and dismiss
        if (itemId) deleteItem(itemId);
        safeDismiss(router);
      } else {
        // Has content — ask
        Alert.alert(
          'Discard changes?',
          'You have unsaved content.',
          [
            { text: 'Keep Editing', style: 'cancel' },
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                if (itemId) deleteItem(itemId);
                safeDismiss(router);
              },
            },
          ],
        );
      }
    } else {
      safeDismiss(router);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Delete "${item.title || '(untitled)'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (itemId) deleteItem(itemId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            safeDismiss(router);
          },
        },
      ],
    );
  };

  const handleCarryForward = () => {
    // Save current item first
    let toSave = { ...item };
    if (toSave.kind === 'task' && !toSave.title.trim()) {
      toSave = { ...toSave, title: `Log: ${toSave.taskData?.date ?? new Date().toISOString().slice(0, 10)}` };
    }
    upsertItem(toSave);

    // Create new task item with unfinished tasks + tomorrow text
    const newItem = createItem('task');
    const unfinished = (toSave.taskData?.tasks ?? [])
      .filter((t) => !t.done)
      .map((t) => ({ ...t, id: uid() }));

    newItem.taskData = {
      date: new Date().toISOString().slice(0, 10),
      tasks: unfinished.length > 0 ? unfinished : [{ id: uid(), text: '', done: false }],
      important: toSave.taskData?.tomorrow ?? '',
      tomorrow: '',
      gratitude: '',
      notes: '',
    };

    upsertItem(newItem);
    // Navigate to new item editor
    safeDismiss(router);
    setTimeout(() => {
      router.push({ pathname: '/editor', params: { itemId: newItem.id } });
    }, 100);
  };

  const kindLabel = KINDS[item.kind]?.label ?? 'Editor';
  const isTask = item.kind === 'task';
  const photoCount = item.photos.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: item.kind === 'sticky' ? (item.stickyMeta?.color === 'green' ? theme.stickyGreen : theme.stickyYellow) : item.kind === 'task' ? theme.plannerPaper : theme.paper }}>
      {/* Nav bar */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: 16,
          paddingTop: (Platform.OS === 'ios' ? 20 : 10) + STAGE_OFFSET,
          paddingBottom: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.ink + '15',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text style={{ fontSize: 16, color: theme.ink, opacity: 0.7 }}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Trash2 size={18} color={theme.danger} />
          </Pressable>
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.ink,
            opacity: 0.5,
          }}
        >
          {kindLabel}
        </Text>
        <View className="flex-row items-center" style={{ gap: 10 }}>
          {/* Add Photo button */}
          <Pressable
            onPress={handleAddPhoto}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.ink + '0D',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <Camera size={15} color={theme.ink + 'AA'} />
            {photoCount > 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: theme.ink,
                  opacity: 0.6,
                }}
              >
                {photoCount}
              </Text>
            ) : null}
          </Pressable>
          {/* Pin to Board button */}
          <Pressable
            onPress={handlePinToBoard}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isPinnedToBoard ? theme.coverPrimary + '22' : theme.ink + '0D',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <MapPin
              size={15}
              color={isPinnedToBoard ? theme.coverPrimary : theme.ink + 'AA'}
            />
          </Pressable>
          {isTask ? (
            <Pressable
              onPress={handleCarryForward}
              className="flex-row items-center"
              style={{
                backgroundColor: theme.plannerGreen + '22',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <FastForward size={14} color={theme.plannerGreen} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: theme.plannerGreen,
                  marginLeft: 4,
                }}
              >
                Carry
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleSave}
            style={{
              backgroundColor: theme.brandGreen,
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Editor content */}
      {item.kind === 'plan' || item.kind === 'note' ? (
        <PlanNoteEditor
          item={item}
          setItem={setItem}
          onAddPhoto={handleAddPhoto}
          onViewPhoto={handleViewPhoto}
        />
      ) : item.kind === 'sticky' ? (
        <StickyEditor
          item={item}
          setItem={setItem}
          onAddPhoto={handleAddPhoto}
          onViewPhoto={handleViewPhoto}
        />
      ) : (
        <TaskEditor
          item={item}
          setItem={setItem}
          onCarryForward={handleCarryForward}
          onAddPhoto={handleAddPhoto}
          onViewPhoto={handleViewPhoto}
        />
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photo={viewingPhoto}
        visible={photoViewerVisible}
        onClose={() => {
          setPhotoViewerVisible(false);
          setViewingPhoto(null);
        }}
        onDelete={handleDeletePhoto}
      />

      {/* Pin feedback toast */}
      {pinFeedback ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute',
            bottom: 40,
            left: 24,
            right: 24,
            backgroundColor: 'rgba(20,20,28,0.92)',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 16,
          }}
        >
          <MapPin size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 }}>
            {pinFeedback}
          </Text>
          {isPinnedToBoard ? (
            <Pressable
              onPress={() => {
                safeDismiss(router);
                setTimeout(() => {
                  router.push('/pinboard');
                }, 300);
              }}
              hitSlop={8}
            >
              <Text style={{ color: theme.brandGreen, fontSize: 13, fontWeight: '700' }}>
                Open board
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}

      {/* Pinboard backlink (persistent, shown when pinned) */}
      {isPinnedToBoard && !pinFeedback ? (
        <Pressable
          onPress={() => {
            safeDismiss(router);
            setTimeout(() => {
              router.push('/pinboard');
            }, 300);
          }}
          style={{
            position: 'absolute',
            bottom: 40,
            left: 24,
            right: 24,
            backgroundColor: 'rgba(20,20,28,0.75)',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MapPin size={14} color={theme.coverPrimary} />
          <Text style={{ color: theme.textOnDesk, fontSize: 13, fontWeight: '500', flex: 1 }}>
            Pinned on board
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>Tap to open</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemKind } from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VFPhoto {
  id: string;
  uri: string;
  addedAt: string;
  source: 'camera' | 'library';
}

export interface TaskRow {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskData {
  date: string;
  tasks: TaskRow[];
  important: string;
  tomorrow: string;
  gratitude: string;
  notes: string;
}

export interface StickyMeta {
  color: 'yellow' | 'green';
}

export interface WorkSession {
  ts: string;
  note?: string;
}

export interface GoalMeta {
  status: 'active' | 'paused' | 'done';
  linkedItemIds: string[];
}

export interface PinboardPin {
  id: string;
  itemId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  locked?: boolean;
}

export interface ArrowData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startBoundId?: string;
  endBoundId?: string;
  color: string;
  strokeWidth: number;
  arrowStyle: 'straight' | 'curved';
}

export interface PinboardElement {
  id: string;
  type: 'sticky' | 'text' | 'image' | 'shape' | 'arrow';
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation?: number;
  locked?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface PinboardViewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface PinboardStroke {
  id: string;
  tool: 'pen' | 'highlighter';
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
  createdAt: string;
}

export interface PinboardData {
  pins: PinboardPin[];
  elements: PinboardElement[];
  viewport: PinboardViewport;
  strokes: PinboardStroke[];
  undoStack: PinboardStroke[][];
  redoStack: PinboardStroke[][];
}

export interface VFItem {
  id: string;
  kind: ItemKind;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  archived: boolean;
  pinned: boolean;
  photos: VFPhoto[];
  taskData?: TaskData;
  stickyMeta?: StickyMeta;
  workSessions?: WorkSession[];
  goalMeta?: GoalMeta;
}

export interface ActivityEntry {
  ts: string;
  summary: string;
}

export interface ShelfItem {
  id: string;
  label: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

const DEFAULT_SHELF_ITEMS: ShelfItem[] = [
  { id: 'plan', label: 'Plan', icon: 'FileText' },
  { id: 'task', label: 'Task', icon: 'CheckSquare' },
  { id: 'journal', label: 'Journal', icon: 'BookOpen' },
  { id: 'studio', label: 'Studio', icon: 'Palette' },
];

export interface DeskStore {
  // Data
  hasHydrated: boolean;
  itemsById: Record<string, VFItem>;
  orderByKind: Record<ItemKind, string[]>;
  activity: ActivityEntry[];
  currentTheme: string;
  currentColorPack?: string;
  pinboard: PinboardData;
  shelfItems: ShelfItem[];
  deskSetupComplete: boolean;
  deskLayout: 'compact' | 'expanded' | 'focus';
  firstLaunchComplete: boolean;
  sampleContentLoaded: boolean;
  sampleItemIds: string[];

  // Actions
  upsertItem: (item: VFItem) => void;
  setShelfItems: (items: ShelfItem[]) => void;
  setDeskSetupComplete: (v: boolean) => void;
  setDeskLayout: (layout: 'compact' | 'expanded' | 'focus') => void;
  removeShelfItem: (id: string) => void;
  deleteItem: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;
  convertItem: (id: string, toKind: ItemKind) => void;
  logActivity: (msg: string) => void;
  setTheme: (themeId: string) => void;
  setColorPack: (packId?: string) => void;
  getItemsByKind: (kind: ItemKind) => VFItem[];
  getItemById: (id: string) => VFItem | undefined;
  searchItems: (query: string) => VFItem[];
  addPin: (pin: PinboardPin) => void;
  updatePin: (id: string, updates: Partial<PinboardPin>) => void;
  removePin: (id: string) => void;
  addElement: (element: PinboardElement) => void;
  updateElement: (id: string, updates: Partial<PinboardElement>) => void;
  removeElement: (id: string) => void;
  setViewport: (viewport: PinboardViewport) => void;
  addStroke: (stroke: PinboardStroke) => void;
  undoInk: () => void;
  redoInk: () => void;
  clearInk: () => void;
  addWorkSession: (itemId: string, note?: string) => void;
  setGoalStatus: (goalId: string, status: 'active' | 'paused' | 'done') => void;
  linkItemToGoal: (goalId: string, itemId: string) => void;
  unlinkItemFromGoal: (goalId: string, itemId: string) => void;
  setFirstLaunchComplete: (v: boolean) => void;
  loadSampleContent: () => void;
  clearSampleContent: () => void;
  resetWorkspace: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_ACTIVITY = 120;

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createItem(kind: ItemKind): VFItem {
  const now = new Date().toISOString();
  const item: VFItem = {
    id: uid(),
    kind,
    title: '',
    body: '',
    createdAt: now,
    updatedAt: now,
    tags: [],
    archived: false,
    pinned: false,
    photos: [],
  };

  if (kind === 'task') {
    item.taskData = {
      date: new Date().toISOString().slice(0, 10),
      tasks: [],
      important: '',
      tomorrow: '',
      gratitude: '',
      notes: '',
    };
  }

  if (kind === 'sticky') {
    item.stickyMeta = { color: 'yellow' };
  }

  if (kind === 'goal') {
    item.goalMeta = {
      status: 'active',
      linkedItemIds: [],
    };
  }

  return item;
}

export function fmtDate(d?: Date): string {
  const date = d ?? new Date();
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtDay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format creation timestamp for display in editors.
 * Shows: "Mon, Jan 15, 2025 at 2:30 PM"
 */
export function fmtCreatedAt(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function taskProgress(item: VFItem): { done: number; total: number; pct: number } {
  const tasks = item.taskData?.tasks ?? [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function globalTaskProgress(store: DeskStore): { done: number; total: number; pct: number } {
  let done = 0;
  let total = 0;
  const taskIds = store.orderByKind.task;
  for (const id of taskIds) {
    const item = store.itemsById[id];
    if (item && !item.archived) {
      const progress = taskProgress(item);
      done += progress.done;
      total += progress.total;
    }
  }
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// ---------------------------------------------------------------------------
// Item conversion helpers
// ---------------------------------------------------------------------------

function collapseTaskData(td: TaskData): string {
  const lines: string[] = [];

  if (td.tasks.length > 0) {
    for (const t of td.tasks) {
      lines.push(t.done ? `\u2713 ${t.text}` : `\u25CB ${t.text}`);
    }
  }

  if (td.important) {
    lines.push('', 'Important:', td.important);
  }
  if (td.tomorrow) {
    lines.push('', 'Tomorrow:', td.tomorrow);
  }
  if (td.gratitude) {
    lines.push('', 'Gratitude:', td.gratitude);
  }
  if (td.notes) {
    lines.push('', 'Notes:', td.notes);
  }

  return lines.join('\n').trim();
}

function normalizeToKind(item: VFItem, toKind: ItemKind): VFItem {
  const now = new Date().toISOString();
  const base: VFItem = { ...item, kind: toKind, updatedAt: now };

  switch (toKind) {
    case 'plan': {
      if (base.taskData) {
        base.body = [base.body, collapseTaskData(base.taskData)].filter(Boolean).join('\n\n');
        delete base.taskData;
      }
      delete base.stickyMeta;
      delete base.goalMeta;
      return base;
    }
    case 'task': {
      if (!base.taskData) {
        const textForTasks = [base.title, base.body].filter(Boolean).join('\n');
        const taskLines = textForTasks
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        base.taskData = {
          date: new Date().toISOString().slice(0, 10),
          tasks: taskLines.map((text) => ({ id: uid(), text, done: false })),
          important: '',
          tomorrow: '',
          gratitude: '',
          notes: '',
        };
      }
      delete base.stickyMeta;
      delete base.goalMeta;
      return base;
    }
    case 'sticky': {
      if (base.taskData) {
        base.body = [base.body, collapseTaskData(base.taskData)].filter(Boolean).join('\n\n');
        delete base.taskData;
      }
      if (!base.stickyMeta) {
        base.stickyMeta = { color: 'yellow' };
      }
      delete base.goalMeta;
      return base;
    }
    case 'note': {
      if (base.taskData) {
        base.body = [base.body, collapseTaskData(base.taskData)].filter(Boolean).join('\n\n');
        delete base.taskData;
      }
      delete base.stickyMeta;
      delete base.goalMeta;
      return base;
    }
    case 'journal':
    case 'vault': {
      if (base.taskData) {
        base.body = [base.body, collapseTaskData(base.taskData)].filter(Boolean).join('\n\n');
        delete base.taskData;
      }
      delete base.stickyMeta;
      delete base.goalMeta;
      return base;
    }
    case 'goal': {
      if (base.taskData) {
        base.body = [base.body, collapseTaskData(base.taskData)].filter(Boolean).join('\n\n');
        delete base.taskData;
      }
      delete base.stickyMeta;
      if (!base.goalMeta) {
        base.goalMeta = { status: 'active', linkedItemIds: [] };
      }
      return base;
    }
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useDeskStore = create<DeskStore>()(
  persist(
    (set, get) => ({
      // ----- Data -----
      hasHydrated: false,
      itemsById: {},
      orderByKind: { plan: [], task: [], sticky: [], note: [], vault: [], journal: [], goal: [] },
      activity: [],
      currentTheme: 'stealth',
      currentColorPack: undefined,
      pinboard: { pins: [], elements: [], viewport: { scale: 1, offsetX: 0, offsetY: 0 }, strokes: [], undoStack: [], redoStack: [] },
      shelfItems: DEFAULT_SHELF_ITEMS,
      deskSetupComplete: false,
      deskLayout: 'expanded' as const,
      firstLaunchComplete: false,
      sampleContentLoaded: false,
      sampleItemIds: [],

      // ----- Actions -----
      setShelfItems: (items: ShelfItem[]) => {
        set({ shelfItems: items });
      },

      setDeskSetupComplete: (v: boolean) => {
        set({ deskSetupComplete: v });
      },

      setDeskLayout: (layout: 'compact' | 'expanded' | 'focus') => {
        set({ deskLayout: layout });
      },

      removeShelfItem: (id: string) => {
        set((state) => ({
          shelfItems: state.shelfItems.filter((x) => String(x.id) !== String(id)),
        }));
      },

      upsertItem: (item: VFItem) => {
        set((state) => {
          const exists = state.itemsById[item.id] != null;
          const now = new Date().toISOString();
          const updated: VFItem = { ...item, updatedAt: now };

          const newItemsById = { ...state.itemsById, [item.id]: updated };

          let newOrderByKind = state.orderByKind;
          if (!exists) {
            // Use empty array fallback for new kinds not in persisted state
            const kindOrder = state.orderByKind[item.kind] ?? [];
            newOrderByKind = {
              ...state.orderByKind,
              [item.kind]: [item.id, ...kindOrder],
            };
          }

          const summary = exists
            ? `Updated ${item.kind}: ${item.title || '(untitled)'}`
            : `Created ${item.kind}: ${item.title || '(untitled)'}`;
          const newActivity: ActivityEntry[] = [
            { ts: now, summary },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);

          return {
            itemsById: newItemsById,
            orderByKind: newOrderByKind,
            activity: newActivity,
          };
        });
      },

      deleteItem: (id: string) => {
        set((state) => {
          const item = state.itemsById[id];
          if (!item) return state;

          const { [id]: _removed, ...restItems } = state.itemsById;

          // Use empty array fallback for safety
          const kindOrder = (state.orderByKind[item.kind] ?? []).filter((i) => i !== id);
          const newOrderByKind = { ...state.orderByKind, [item.kind]: kindOrder };

          const now = new Date().toISOString();
          const newActivity: ActivityEntry[] = [
            { ts: now, summary: `Deleted ${item.kind}: ${item.title || '(untitled)'}` },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);

          return {
            itemsById: restItems,
            orderByKind: newOrderByKind,
            activity: newActivity,
          };
        });
      },

      togglePin: (id: string) => {
        set((state) => {
          const item = state.itemsById[id];
          if (!item) return state;

          const nowPinned = !item.pinned;
          const now = new Date().toISOString();
          const updated: VFItem = { ...item, pinned: nowPinned, updatedAt: now };
          const newItemsById = { ...state.itemsById, [id]: updated };

          // Use empty array fallback for safety
          let kindOrder = state.orderByKind[item.kind] ?? [];
          if (nowPinned) {
            kindOrder = [id, ...kindOrder.filter((i) => i !== id)];
          }
          const newOrderByKind = { ...state.orderByKind, [item.kind]: kindOrder };

          return { itemsById: newItemsById, orderByKind: newOrderByKind };
        });
      },

      toggleArchive: (id: string) => {
        set((state) => {
          const item = state.itemsById[id];
          if (!item) return state;

          const nowArchived = !item.archived;
          const now = new Date().toISOString();
          const updated: VFItem = { ...item, archived: nowArchived, updatedAt: now };
          const newItemsById = { ...state.itemsById, [id]: updated };

          const summary = nowArchived
            ? `Archived ${item.kind}: ${item.title || '(untitled)'}`
            : `Unarchived ${item.kind}: ${item.title || '(untitled)'}`;
          const newActivity: ActivityEntry[] = [
            { ts: now, summary },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);

          return { itemsById: newItemsById, activity: newActivity };
        });
      },

      convertItem: (id: string, toKind: ItemKind) => {
        set((state) => {
          const item = state.itemsById[id];
          if (!item || item.kind === toKind) return state;

          const oldKind = item.kind;
          const converted = normalizeToKind(item, toKind);

          const newItemsById = { ...state.itemsById, [id]: converted };

          // Use empty array fallbacks for safety with new kinds
          const oldOrder = (state.orderByKind[oldKind] ?? []).filter((i) => i !== id);
          const newOrder = [id, ...(state.orderByKind[toKind] ?? [])];
          const newOrderByKind = {
            ...state.orderByKind,
            [oldKind]: oldOrder,
            [toKind]: newOrder,
          };

          const now = new Date().toISOString();
          const newActivity: ActivityEntry[] = [
            {
              ts: now,
              summary: `Converted "${item.title || '(untitled)'}" from ${oldKind} to ${toKind}`,
            },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);

          return {
            itemsById: newItemsById,
            orderByKind: newOrderByKind,
            activity: newActivity,
          };
        });
      },

      logActivity: (msg: string) => {
        set((state) => {
          const now = new Date().toISOString();
          const newActivity: ActivityEntry[] = [
            { ts: now, summary: msg },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);
          return { activity: newActivity };
        });
      },

      setTheme: (themeId: string) => {
        set({ currentTheme: themeId });
      },

      setColorPack: (packId?: string) => {
        set({ currentColorPack: packId });
      },

      getItemsByKind: (kind: ItemKind): VFItem[] => {
        const state = get();
        const ids = state.orderByKind[kind] ?? [];
        const items: VFItem[] = [];
        for (const id of ids) {
          const item = state.itemsById[id];
          if (item) items.push(item);
        }
        return items;
      },

      getItemById: (id: string): VFItem | undefined => {
        return get().itemsById[id];
      },

      searchItems: (query: string): VFItem[] => {
        const state = get();
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return [];

        const results: VFItem[] = [];
        for (const item of Object.values(state.itemsById)) {
          const searchableText = [
            item.title,
            item.body,
            ...item.tags,
            item.taskData?.important ?? '',
            item.taskData?.tomorrow ?? '',
            item.taskData?.gratitude ?? '',
            item.taskData?.notes ?? '',
            ...(item.taskData?.tasks.map((t) => t.text) ?? []),
          ]
            .join(' ')
            .toLowerCase();

          const allMatch = terms.every((term) => searchableText.includes(term));
          if (allMatch) results.push(item);
        }

        return results;
      },

      addPin: (pin: PinboardPin) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            pins: [...state.pinboard.pins, pin],
          },
        }));
      },

      updatePin: (id: string, updates: Partial<PinboardPin>) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            pins: state.pinboard.pins.map((p) =>
              p.id === id ? { ...p, ...updates } : p,
            ),
          },
        }));
      },

      removePin: (id: string) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            pins: state.pinboard.pins.filter((p) => p.id !== id),
          },
        }));
      },

      addElement: (element: PinboardElement) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            elements: [...(state.pinboard.elements ?? []), element],
          },
        }));
      },

      updateElement: (id: string, updates: Partial<PinboardElement>) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            elements: (state.pinboard.elements ?? []).map((el) =>
              el.id === id ? { ...el, ...updates } : el,
            ),
          },
        }));
      },

      removeElement: (id: string) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            elements: (state.pinboard.elements ?? []).filter((el) => el.id !== id),
          },
        }));
      },

      setViewport: (viewport: PinboardViewport) => {
        set((state) => ({
          pinboard: {
            ...state.pinboard,
            viewport,
          },
        }));
      },

      addStroke: (stroke: PinboardStroke) => {
        set((state) => {
          const nextUndoStack = [...state.pinboard.undoStack, state.pinboard.strokes];
          if (nextUndoStack.length > 75) nextUndoStack.splice(0, nextUndoStack.length - 75);
          return {
            pinboard: {
              ...state.pinboard,
              undoStack: nextUndoStack,
              redoStack: [],
              strokes: [...state.pinboard.strokes, stroke],
            },
          };
        });
      },

      undoInk: () => {
        set((state) => {
          const undoStack = state.pinboard.undoStack;
          if (undoStack.length === 0) return state;
          const previousStrokes = undoStack[undoStack.length - 1];
          return {
            pinboard: {
              ...state.pinboard,
              strokes: previousStrokes,
              undoStack: undoStack.slice(0, -1),
              redoStack: [...state.pinboard.redoStack, state.pinboard.strokes],
            },
          };
        });
      },

      redoInk: () => {
        set((state) => {
          const redoStack = state.pinboard.redoStack;
          if (redoStack.length === 0) return state;
          const nextStrokes = redoStack[redoStack.length - 1];
          return {
            pinboard: {
              ...state.pinboard,
              strokes: nextStrokes,
              undoStack: [...state.pinboard.undoStack, state.pinboard.strokes],
              redoStack: redoStack.slice(0, -1),
            },
          };
        });
      },

      clearInk: () => {
        set((state) => {
          if (state.pinboard.strokes.length === 0) return state;
          return {
            pinboard: {
              ...state.pinboard,
              undoStack: [...state.pinboard.undoStack, state.pinboard.strokes],
              redoStack: [],
              strokes: [],
            },
          };
        });
      },

      addWorkSession: (itemId: string, note?: string) => {
        set((state) => {
          const item = state.itemsById[itemId];
          if (!item) return state;

          const session: WorkSession = {
            ts: new Date().toISOString(),
            note,
          };
          const sessions = [...(item.workSessions ?? []), session];
          const now = new Date().toISOString();
          const updated: VFItem = {
            ...item,
            workSessions: sessions,
            updatedAt: now,
          };

          const newActivity: ActivityEntry[] = [
            {
              ts: now,
              summary: `Logged work session on "${item.title || '(untitled)'}"`,
            },
            ...state.activity,
          ].slice(0, MAX_ACTIVITY);

          return {
            itemsById: { ...state.itemsById, [itemId]: updated },
            activity: newActivity,
          };
        });
      },

      setGoalStatus: (goalId: string, status: 'active' | 'paused' | 'done') => {
        set((state) => {
          const goal = state.itemsById[goalId];
          if (!goal || goal.kind !== 'goal') return state;

          const now = new Date().toISOString();
          const updated: VFItem = {
            ...goal,
            goalMeta: { ...goal.goalMeta!, status },
            updatedAt: now,
          };

          return {
            itemsById: { ...state.itemsById, [goalId]: updated },
          };
        });
      },

      linkItemToGoal: (goalId: string, itemId: string) => {
        set((state) => {
          const goal = state.itemsById[goalId];
          if (!goal || goal.kind !== 'goal') return state;

          const linkedIds = goal.goalMeta?.linkedItemIds ?? [];
          if (linkedIds.includes(itemId)) return state;

          const now = new Date().toISOString();
          const updated: VFItem = {
            ...goal,
            goalMeta: { ...goal.goalMeta!, linkedItemIds: [...linkedIds, itemId] },
            updatedAt: now,
          };

          return {
            itemsById: { ...state.itemsById, [goalId]: updated },
          };
        });
      },

      unlinkItemFromGoal: (goalId: string, itemId: string) => {
        set((state) => {
          const goal = state.itemsById[goalId];
          if (!goal || goal.kind !== 'goal') return state;

          const linkedIds = (goal.goalMeta?.linkedItemIds ?? []).filter((id) => id !== itemId);

          const now = new Date().toISOString();
          const updated: VFItem = {
            ...goal,
            goalMeta: { ...goal.goalMeta!, linkedItemIds: linkedIds },
            updatedAt: now,
          };

          return {
            itemsById: { ...state.itemsById, [goalId]: updated },
          };
        });
      },

      setFirstLaunchComplete: (v: boolean) => {
        set({ firstLaunchComplete: v });
      },

      loadSampleContent: () => {
        const now = new Date().toISOString();
        const makeId = () => uid();

        // Pinboard items (plan kind, shown as pins)
        const pin1: VFItem = { id: makeId(), kind: 'plan', title: 'Quick Capture', body: 'Dump ideas here fast.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [] };
        const pin2: VFItem = { id: makeId(), kind: 'plan', title: 'Today Plan', body: 'Outline your day.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [] };
        const pin3: VFItem = { id: makeId(), kind: 'plan', title: 'Project Board', body: 'Track project milestones.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [] };
        const pin4: VFItem = { id: makeId(), kind: 'plan', title: 'Weekly Review', body: 'Reflect and reset each week.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [] };

        // Task
        const task1: VFItem = { id: makeId(), kind: 'task', title: 'Sample Tasks', body: '', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [], taskData: { date: now.slice(0, 10), tasks: [{ id: makeId(), text: 'Review your goals', done: false }, { id: makeId(), text: 'Plan tomorrow', done: false }, { id: makeId(), text: 'Clear inbox', done: true }], important: 'Ship the feature', tomorrow: 'Write tests', gratitude: 'Great team', notes: '' } };
        const task2: VFItem = { id: makeId(), kind: 'task', title: 'Onboarding Checklist', body: '', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [], taskData: { date: now.slice(0, 10), tasks: [{ id: makeId(), text: 'Set up your desk', done: true }, { id: makeId(), text: 'Add your first pin', done: false }], important: '', tomorrow: '', gratitude: '', notes: '' } };
        const task3: VFItem = { id: makeId(), kind: 'task', title: 'Daily Habits', body: '', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [], taskData: { date: now.slice(0, 10), tasks: [{ id: makeId(), text: 'Morning review', done: false }, { id: makeId(), text: 'Evening wrap-up', done: false }], important: '', tomorrow: '', gratitude: '', notes: '' } };

        // Note
        const note1: VFItem = { id: makeId(), kind: 'note', title: 'Welcome Note', body: 'This is a sample workspace. Explore the desk, open the Pinboard, and make it your own. Delete sample content anytime from Settings.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [] };

        // Stickies
        const sticky1: VFItem = { id: makeId(), kind: 'sticky', title: '💡 Tip', body: 'Long-press shelf items to remove them.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [], stickyMeta: { color: 'yellow' } };
        const sticky2: VFItem = { id: makeId(), kind: 'sticky', title: '📌 Pinboard', body: 'Drag items around the canvas.', createdAt: now, updatedAt: now, tags: ['sample'], archived: false, pinned: false, photos: [], stickyMeta: { color: 'green' } };

        const allItems = [pin1, pin2, pin3, pin4, task1, task2, task3, note1, sticky1, sticky2];
        const sampleIds = allItems.map((i) => i.id);

        set((state) => {
          const newItemsById = { ...state.itemsById };
          const newOrderByKind = { ...state.orderByKind };
          for (const item of allItems) {
            newItemsById[item.id] = item;
            newOrderByKind[item.kind] = [item.id, ...(newOrderByKind[item.kind] ?? [])];
          }

          // Create pinboard pins for the 4 plan items
          const pinItems = [pin1, pin2, pin3, pin4];
          const newPins = pinItems.map((item, i) => ({
            id: uid(),
            itemId: item.id,
            x: 20 + (i % 2) * 200,
            y: 60 + Math.floor(i / 2) * 160,
            w: 180,
            h: 120,
            z: i,
          }));

          return {
            itemsById: newItemsById,
            orderByKind: newOrderByKind,
            pinboard: { ...state.pinboard, pins: [...state.pinboard.pins, ...newPins] },
            sampleContentLoaded: true,
            sampleItemIds: sampleIds,
          };
        });
      },

      clearSampleContent: () => {
        set((state) => {
          const ids = new Set(state.sampleItemIds);
          const newItemsById = { ...state.itemsById };
          const newOrderByKind = { ...state.orderByKind };

          for (const id of ids) {
            const item = newItemsById[id];
            if (item) {
              delete newItemsById[id];
              newOrderByKind[item.kind] = (newOrderByKind[item.kind] ?? []).filter((i) => i !== id);
            }
          }

          const newPins = state.pinboard.pins.filter((p) => !ids.has(p.itemId));

          return {
            itemsById: newItemsById,
            orderByKind: newOrderByKind,
            pinboard: { ...state.pinboard, pins: newPins },
            sampleContentLoaded: false,
            sampleItemIds: [],
          };
        });
      },

      resetWorkspace: () => {
        set({
          itemsById: {},
          orderByKind: { plan: [], task: [], sticky: [], note: [], vault: [], journal: [], goal: [] },
          activity: [],
          pinboard: { pins: [], elements: [], viewport: { scale: 1, offsetX: 0, offsetY: 0 }, strokes: [], undoStack: [], redoStack: [] },
          shelfItems: DEFAULT_SHELF_ITEMS,
          deskSetupComplete: false,
          deskLayout: 'expanded',
          firstLaunchComplete: false,
          sampleContentLoaded: false,
          sampleItemIds: [],
        });
      },
    }),
    {
      name: 'vf-desk-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        itemsById: state.itemsById,
        orderByKind: state.orderByKind,
        activity: state.activity,
        currentTheme: state.currentTheme,
        currentColorPack: state.currentColorPack,
        pinboard: state.pinboard,
        shelfItems: state.shelfItems,
        deskSetupComplete: state.deskSetupComplete,
        deskLayout: state.deskLayout,
        firstLaunchComplete: state.firstLaunchComplete,
        sampleContentLoaded: state.sampleContentLoaded,
        sampleItemIds: state.sampleItemIds,
      }),
      // Merge persisted state with defaults to handle missing/new properties
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DeskStore> | undefined;

        // Ensure orderByKind has all required kinds
        const defaultOrderByKind = { plan: [], task: [], sticky: [], note: [], vault: [], journal: [], goal: [] };
        const mergedOrderByKind = {
          ...defaultOrderByKind,
          ...(persisted?.orderByKind ?? {}),
        };

        return {
          ...currentState,
          ...persisted,
          orderByKind: mergedOrderByKind,
          // Ensure other required properties exist
          itemsById: persisted?.itemsById ?? {},
          activity: persisted?.activity ?? [],
          pinboard: persisted?.pinboard
            ? {
                pins: persisted.pinboard.pins ?? [],
                elements: persisted.pinboard.elements ?? [],
                viewport: persisted.pinboard.viewport ?? { scale: 1, offsetX: 0, offsetY: 0 },
                strokes: (persisted.pinboard as any).strokes ?? [],
                undoStack: [],
                redoStack: [],
              }
            : { pins: [], elements: [], viewport: { scale: 1, offsetX: 0, offsetY: 0 }, strokes: [], undoStack: [], redoStack: [] },
          shelfItems: persisted?.shelfItems ?? DEFAULT_SHELF_ITEMS,
          deskSetupComplete: persisted?.deskSetupComplete ?? false,
          deskLayout: persisted?.deskLayout ?? 'expanded',
          firstLaunchComplete: persisted?.firstLaunchComplete ?? false,
          sampleContentLoaded: persisted?.sampleContentLoaded ?? false,
          sampleItemIds: persisted?.sampleItemIds ?? [],
        };
      },
      onRehydrateStorage: () => () => {
        useDeskStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export default useDeskStore;

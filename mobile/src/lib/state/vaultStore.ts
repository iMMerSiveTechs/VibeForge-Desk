import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Parses [[Target]] wiki-link patterns from markdown content.
 * Returns an array of target strings (stripped of brackets).
 */
export function parseWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const targets: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target && !targets.includes(target)) {
      targets.push(target);
    }
  }
  return targets;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VaultMeta {
  id: string;
  name: string;
  createdAt: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  parentId: string | null;
  vaultId: string;
  createdAt: string;
}

export interface VaultNote {
  id: string;
  vaultId: string;
  folderId: string | null;
  title: string;
  content: string;
  path: string; // display path like /folder/title
  createdAt: string;
  updatedAt: string;
  parsedLinks: string[]; // wiki-link targets found in content
}

export interface ContextPack {
  id: string;
  vaultId: string;
  title: string;
  operatingBrief: string;
  noteIds: string[];
  rulesDo: string[];
  rulesDont: string[];
}

export interface VaultStore {
  vaults: VaultMeta[];
  foldersById: Record<string, VaultFolder>;
  notesById: Record<string, VaultNote>;
  contextPacksById: Record<string, ContextPack>;
  activeVaultId: string | null;
  // backlinks index: noteId -> noteIds that link to it
  backlinksIndex: Record<string, string[]>;

  // Vault actions
  createVault(name: string): VaultMeta;
  deleteVault(id: string): void;
  setActiveVault(id: string): void;

  // Folder actions
  createFolder(vaultId: string, name: string, parentId?: string): VaultFolder;
  renameFolder(id: string, name: string): void;
  deleteFolder(id: string): void;

  // Note actions
  createNote(vaultId: string, title: string, folderId?: string, content?: string): VaultNote;
  updateNote(id: string, updates: Partial<Pick<VaultNote, 'title' | 'content' | 'folderId' | 'path' | 'parsedLinks'>>): void;
  deleteNote(id: string): void;
  rebuildBacklinks(vaultId: string): void;

  // Context pack actions
  createContextPack(vaultId: string, title: string): ContextPack;
  updateContextPack(id: string, updates: Partial<Omit<ContextPack, 'id' | 'vaultId'>>): void;
  deleteContextPack(id: string): void;
}

// ---------------------------------------------------------------------------
// README template
// ---------------------------------------------------------------------------

function buildReadmeContent(vaultName: string): string {
  return `# ${vaultName}

> This is your operating brief. Use it to capture current priorities, rules, and the index of important notes.

## Current Priorities


## Index


## Rules


`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      vaults: [],
      foldersById: {},
      notesById: {},
      contextPacksById: {},
      activeVaultId: null,
      backlinksIndex: {},

      // ---- Vault Actions ----

      createVault(name: string): VaultMeta {
        const now = new Date().toISOString();
        const vault: VaultMeta = { id: uid(), name, createdAt: now };

        // Auto-create README note at root
        const readmeNote: VaultNote = {
          id: uid(),
          vaultId: vault.id,
          folderId: null,
          title: 'README',
          content: buildReadmeContent(name),
          path: '/README',
          createdAt: now,
          updatedAt: now,
          parsedLinks: [],
        };

        set((state) => ({
          vaults: [...state.vaults, vault],
          notesById: { ...state.notesById, [readmeNote.id]: readmeNote },
          activeVaultId: state.activeVaultId ?? vault.id,
        }));

        return vault;
      },

      deleteVault(id: string): void {
        set((state) => {
          const newVaults = state.vaults.filter((v) => v.id !== id);

          // Remove all folders, notes, context packs belonging to this vault
          const newFolders: Record<string, VaultFolder> = {};
          for (const [fid, folder] of Object.entries(state.foldersById)) {
            if (folder.vaultId !== id) newFolders[fid] = folder;
          }

          const newNotes: Record<string, VaultNote> = {};
          for (const [nid, note] of Object.entries(state.notesById)) {
            if (note.vaultId !== id) newNotes[nid] = note;
          }

          const newPacks: Record<string, ContextPack> = {};
          for (const [pid, pack] of Object.entries(state.contextPacksById)) {
            if (pack.vaultId !== id) newPacks[pid] = pack;
          }

          const newActiveVaultId =
            state.activeVaultId === id
              ? (newVaults[0]?.id ?? null)
              : state.activeVaultId;

          return {
            vaults: newVaults,
            foldersById: newFolders,
            notesById: newNotes,
            contextPacksById: newPacks,
            activeVaultId: newActiveVaultId,
          };
        });
      },

      setActiveVault(id: string): void {
        set({ activeVaultId: id });
      },

      // ---- Folder Actions ----

      createFolder(vaultId: string, name: string, parentId?: string): VaultFolder {
        const now = new Date().toISOString();
        const folder: VaultFolder = {
          id: uid(),
          name,
          parentId: parentId ?? null,
          vaultId,
          createdAt: now,
        };
        set((state) => ({
          foldersById: { ...state.foldersById, [folder.id]: folder },
        }));
        return folder;
      },

      renameFolder(id: string, name: string): void {
        set((state) => {
          const folder = state.foldersById[id];
          if (!folder) return state;
          return {
            foldersById: { ...state.foldersById, [id]: { ...folder, name } },
          };
        });
      },

      deleteFolder(id: string): void {
        set((state) => {
          // Collect all descendant folder ids recursively
          const toDelete = new Set<string>();
          const queue = [id];
          while (queue.length > 0) {
            const fid = queue.pop()!;
            toDelete.add(fid);
            for (const [childId, folder] of Object.entries(state.foldersById)) {
              if (folder.parentId === fid) queue.push(childId);
            }
          }

          const newFolders: Record<string, VaultFolder> = {};
          for (const [fid, folder] of Object.entries(state.foldersById)) {
            if (!toDelete.has(fid)) newFolders[fid] = folder;
          }

          // Delete notes in those folders
          const newNotes: Record<string, VaultNote> = {};
          for (const [nid, note] of Object.entries(state.notesById)) {
            if (!note.folderId || !toDelete.has(note.folderId)) {
              newNotes[nid] = note;
            }
          }

          return { foldersById: newFolders, notesById: newNotes };
        });
      },

      // ---- Note Actions ----

      createNote(
        vaultId: string,
        title: string,
        folderId?: string,
        content?: string,
      ): VaultNote {
        const now = new Date().toISOString();
        const resolvedFolderId = folderId ?? null;
        const resolvedContent = content ?? '';
        const parsedLinks = parseWikiLinks(resolvedContent);

        // Build display path
        let path = `/${title}`;
        if (resolvedFolderId) {
          const folder = get().foldersById[resolvedFolderId];
          if (folder) path = `/${folder.name}/${title}`;
        }

        const note: VaultNote = {
          id: uid(),
          vaultId,
          folderId: resolvedFolderId,
          title,
          content: resolvedContent,
          path,
          createdAt: now,
          updatedAt: now,
          parsedLinks,
        };

        set((state) => ({
          notesById: { ...state.notesById, [note.id]: note },
        }));

        return note;
      },

      updateNote(
        id: string,
        updates: Partial<Pick<VaultNote, 'title' | 'content' | 'folderId' | 'path' | 'parsedLinks'>>,
      ): void {
        set((state) => {
          const note = state.notesById[id];
          if (!note) return state;

          const newContent = updates.content !== undefined ? updates.content : note.content;
          const newTitle = updates.title !== undefined ? updates.title : note.title;
          const newFolderId = updates.folderId !== undefined ? updates.folderId : note.folderId;
          const parsedLinks = updates.content !== undefined
            ? parseWikiLinks(newContent)
            : (updates.parsedLinks ?? note.parsedLinks);

          // Rebuild path
          let path = `/${newTitle}`;
          if (newFolderId) {
            const folder = state.foldersById[newFolderId];
            if (folder) path = `/${folder.name}/${newTitle}`;
          }

          const updated: VaultNote = {
            ...note,
            ...updates,
            title: newTitle,
            content: newContent,
            folderId: newFolderId,
            path: updates.path ?? path,
            parsedLinks,
            updatedAt: new Date().toISOString(),
          };

          return { notesById: { ...state.notesById, [id]: updated } };
        });
      },

      deleteNote(id: string): void {
        set((state) => {
          const { [id]: _removed, ...restNotes } = state.notesById;

          // Remove from backlinks index
          const newBacklinks: Record<string, string[]> = {};
          for (const [targetId, sourceIds] of Object.entries(state.backlinksIndex)) {
            const filtered = sourceIds.filter((sid) => sid !== id);
            if (filtered.length > 0) newBacklinks[targetId] = filtered;
          }
          // Remove this note's entry
          delete newBacklinks[id];

          return { notesById: restNotes, backlinksIndex: newBacklinks };
        });
      },

      rebuildBacklinks(vaultId: string): void {
        set((state) => {
          // Collect all notes in vault
          const vaultNotes = Object.values(state.notesById).filter(
            (n) => n.vaultId === vaultId,
          );

          // Build a title/path -> noteId lookup for matching
          const titleToId: Record<string, string> = {};
          for (const note of vaultNotes) {
            titleToId[note.title.toLowerCase()] = note.id;
            titleToId[note.path.toLowerCase()] = note.id;
          }

          // Remove old backlinks for this vault
          const newBacklinks: Record<string, string[]> = { ...state.backlinksIndex };
          for (const note of vaultNotes) {
            delete newBacklinks[note.id];
          }

          // Rebuild
          for (const note of vaultNotes) {
            for (const target of note.parsedLinks) {
              const targetId = titleToId[target.toLowerCase()];
              if (targetId && targetId !== note.id) {
                if (!newBacklinks[targetId]) newBacklinks[targetId] = [];
                if (!newBacklinks[targetId].includes(note.id)) {
                  newBacklinks[targetId] = [...newBacklinks[targetId], note.id];
                }
              }
            }
          }

          return { backlinksIndex: newBacklinks };
        });
      },

      // ---- Context Pack Actions ----

      createContextPack(vaultId: string, title: string): ContextPack {
        const pack: ContextPack = {
          id: uid(),
          vaultId,
          title,
          operatingBrief: '',
          noteIds: [],
          rulesDo: [],
          rulesDont: [],
        };
        set((state) => ({
          contextPacksById: { ...state.contextPacksById, [pack.id]: pack },
        }));
        return pack;
      },

      updateContextPack(
        id: string,
        updates: Partial<Omit<ContextPack, 'id' | 'vaultId'>>,
      ): void {
        set((state) => {
          const pack = state.contextPacksById[id];
          if (!pack) return state;
          return {
            contextPacksById: {
              ...state.contextPacksById,
              [id]: { ...pack, ...updates },
            },
          };
        });
      },

      deleteContextPack(id: string): void {
        set((state) => {
          const { [id]: _removed, ...rest } = state.contextPacksById;
          return { contextPacksById: rest };
        });
      },
    }),
    {
      name: 'vf-vault-os-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        vaults: state.vaults,
        foldersById: state.foldersById,
        notesById: state.notesById,
        contextPacksById: state.contextPacksById,
        activeVaultId: state.activeVaultId,
        backlinksIndex: state.backlinksIndex,
      }),
    },
  ),
);

export default useVaultStore;

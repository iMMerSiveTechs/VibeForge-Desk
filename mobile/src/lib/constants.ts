export type ItemKind = 'plan' | 'task' | 'sticky' | 'note' | 'vault' | 'journal' | 'goal';

// CoreKind: the 4 kinds that StackCard renders as tiles on Home.
// vault/journal/goal are system kinds with dedicated wide cards — never passed to StackCard.
export type CoreKind = 'plan' | 'task' | 'sticky' | 'note';

export type HomePlacement = 'tile' | 'wide' | 'hidden';

export const KINDS = {
  plan: { key: 'plan', label: 'Master Plan', deskLabel: 'STRATEGY' },
  task: { key: 'task', label: 'Task Planner', deskLabel: 'DAILY LOG' },
  sticky: { key: 'sticky', label: 'Stickies', deskLabel: 'QUICK CAPTURE' },
  note: { key: 'note', label: 'Steno Notebook', deskLabel: 'REFINEMENT' },
  vault: { key: 'vault', label: 'Vault', deskLabel: 'ARCHIVE' },
  journal: { key: 'journal', label: 'Journal', deskLabel: 'DAILY WRITE' },
  goal: { key: 'goal', label: 'Goals', deskLabel: 'OKR BOARD' },
} as const;

export const KIND_KEYS: ItemKind[] = ['plan', 'task', 'sticky', 'note', 'vault', 'journal', 'goal'];

// KIND_REGISTRY: Central source of truth for how each kind is displayed on Home
export const KIND_REGISTRY: Record<ItemKind, {
  icon: string;
  label: string;
  homePlacement: HomePlacement;
}> = {
  plan: { icon: 'FileText', label: 'Plan', homePlacement: 'tile' },
  task: { icon: 'CheckSquare', label: 'Task', homePlacement: 'tile' },
  sticky: { icon: 'StickyNote', label: 'Sticky', homePlacement: 'tile' },
  note: { icon: 'BookOpen', label: 'Notes', homePlacement: 'tile' },
  vault: { icon: 'Archive', label: 'Vault', homePlacement: 'wide' },
  journal: { icon: 'BookOpen', label: 'Journal', homePlacement: 'wide' },
  goal: { icon: 'Target', label: 'Goals', homePlacement: 'wide' },
};

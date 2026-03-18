import type { ItemKind } from '../../constants';

export interface LlmTaskData {
  date: string;
  tasks: Array<{ text: string; done: boolean }>;
  important: string;
  tomorrow: string;
  gratitude: string;
  notes: string;
}

export interface LlmExtract {
  kind: ItemKind;
  title: string;
  body: string;
  tags: string[];
  taskData?: LlmTaskData;
}

export type DeskKind = ItemKind;

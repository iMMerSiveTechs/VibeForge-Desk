/**
 * Export service: JSON, Markdown, TXT formats
 */

import type { VFItem } from '../state/store';

export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
}

export function exportItemsAsJson(items: VFItem[]): ExportResult {
  const content = JSON.stringify(items, null, 2);
  return {
    filename: `vibeforge-desk-${new Date().toISOString().slice(0, 10)}.json`,
    content,
    mimeType: 'application/json',
  };
}

export function exportItemsAsMarkdown(items: VFItem[]): ExportResult {
  const lines: string[] = [];
  lines.push(`# VibeForge Desk Export`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const item of items) {
    lines.push(`## ${item.title || '(Untitled)'}`);
    lines.push(`**Kind:** ${item.kind}`);
    lines.push(`**Created:** ${item.createdAt}`);
    if (item.tags.length > 0) {
      lines.push(`**Tags:** ${item.tags.join(', ')}`);
    }
    lines.push('');
    lines.push(item.body);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return {
    filename: `vibeforge-desk-${new Date().toISOString().slice(0, 10)}.md`,
    content: lines.join('\n'),
    mimeType: 'text/markdown',
  };
}

export function exportItemsAsText(items: VFItem[]): ExportResult {
  const lines: string[] = [];
  lines.push(`VibeForge Desk Export`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const item of items) {
    lines.push(`${item.title || '(Untitled)'}`);
    lines.push(`Kind: ${item.kind} | Created: ${item.createdAt}`);
    if (item.tags.length > 0) {
      lines.push(`Tags: ${item.tags.join(', ')}`);
    }
    lines.push('');
    lines.push(item.body);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return {
    filename: `vibeforge-desk-${new Date().toISOString().slice(0, 10)}.txt`,
    content: lines.join('\n'),
    mimeType: 'text/plain',
  };
}

export function importItemsFromJson(jsonString: string): VFItem[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Journal service: Entry creation, prompts, timeline
 */

import type { VFItem } from '../state/store';

export interface JournalPrompt {
  key: string;
  label: string;
  placeholder: string;
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { key: 'wins', label: 'Wins', placeholder: 'What went well today?' },
  { key: 'lessons', label: 'Lessons', placeholder: 'What did you learn?' },
  { key: 'mood', label: 'Mood', placeholder: 'How do you feel right now?' },
  { key: 'intent', label: 'Intent', placeholder: 'What do you want to focus on tomorrow?' },
  { key: 'gratitude', label: 'Gratitude', placeholder: 'What are you grateful for?' },
];

export interface JournalEntry {
  date: string;
  wins: string;
  lessons: string;
  mood: string;
  intent: string;
  gratitude: string;
}

/**
 * Extract journal entry data from item body.
 * Expected format: "wins\nlessons\nmood\nintent\ngratitude"
 */
export function parseJournalEntry(item: VFItem): JournalEntry {
  const lines = item.body.split('\n');
  return {
    date: item.createdAt.slice(0, 10),
    wins: lines[0] ?? '',
    lessons: lines[1] ?? '',
    mood: lines[2] ?? '',
    intent: lines[3] ?? '',
    gratitude: lines[4] ?? '',
  };
}

/**
 * Format journal entry data back into item body
 */
export function formatJournalEntry(entry: JournalEntry): string {
  return [entry.wins, entry.lessons, entry.mood, entry.intent, entry.gratitude].join('\n');
}

/**
 * Get all journal entries grouped by month
 */
export function groupJournalsByMonth(items: VFItem[]): Record<string, VFItem[]> {
  const journalItems = items.filter((i) => i.kind === 'journal');
  const grouped: Record<string, VFItem[]> = {};

  for (const item of journalItems) {
    const month = item.createdAt.slice(0, 7); // YYYY-MM
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(item);
  }

  // Sort each month's entries by date descending
  for (const month in grouped) {
    grouped[month].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return grouped;
}

/**
 * Calculate journal streak: consecutive days with entries
 */
export function calculateStreak(items: VFItem[]): number {
  const journalItems = items
    .filter((i) => i.kind === 'journal')
    .map((i) => i.createdAt.slice(0, 10))
    .sort()
    .reverse();

  if (journalItems.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  let currentDate = new Date(journalItems[0]);

  for (let i = 1; i < journalItems.length; i++) {
    const prevDate = new Date(journalItems[i]);
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

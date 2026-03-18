import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VFItem } from '@/lib/state/store';

const DISMISSED_KEY = 'vf.dismissed_suggestions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedSuggestion {
  id: string;
  sourceItemId: string;
  sourceKind: string;
  sourceTitle: string;
  evidenceSnippet: string;
  title: string;
  date: Date | null;
  time: { hour: number; minute: number } | null;
  duration: number; // minutes
  location: string | null;
  needsConfirmation: boolean;
  dismissed: boolean;
}

// ---------------------------------------------------------------------------
// Stable ID helper — no Buffer, no crypto
// ---------------------------------------------------------------------------

function makeId(sourceItemId: string, line: string): string {
  const slug = line
    .slice(0, 40)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_:]/g, '');
  return `${sourceItemId}:${slug}`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

/** Next occurrence of a given weekday (0=Sun … 6=Sat).
 *  If today is that weekday and the time hasn't passed, returns today. */
function nextWeekday(targetDay: number): Date {
  const today = startOfToday();
  const currentDay = today.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  // diff === 0 means today — we accept today (caller handles "time passed" check)
  return addDays(today, diff);
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const DAY_NAMES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

// ---------------------------------------------------------------------------
// Parse a single line for date/time/duration/location/title
// ---------------------------------------------------------------------------

interface LineMatch {
  date: Date | null;
  time: { hour: number; minute: number } | null;
  duration: number; // minutes, default 60
  location: string | null;
  title: string;
  usedRanges: [number, number][];
}

function parseTime(lower: string, original: string): { time: { hour: number; minute: number } | null; ranges: [number, number][] } {
  const ranges: [number, number][] = [];

  // Pattern 1: HH:MM am/pm or HH:MM (24h or bare)
  const re1 = /(\d{1,2}):(\d{2})\s*(am|pm)?/gi;
  let m = re1.exec(lower);
  if (m) {
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const ampm = m[3]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    ranges.push([m.index, m.index + m[0].length]);
    return { time: { hour, minute }, ranges };
  }

  // Pattern 2: N am/pm
  const re2 = /\b(\d{1,2})\s*(am|pm)\b/gi;
  m = re2.exec(lower);
  if (m) {
    let hour = parseInt(m[1], 10);
    const ampm = m[2].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    ranges.push([m.index, m.index + m[0].length]);
    return { time: { hour, minute: 0 }, ranges };
  }

  // Pattern 3: "at N" without am/pm — if N < 8 assume pm, else am
  const re3 = /\bat\s+(\d{1,2})(?::(\d{2}))?(?!\s*(?:am|pm))/gi;
  m = re3.exec(lower);
  if (m) {
    let hour = parseInt(m[1], 10);
    const minute = m[2] ? parseInt(m[2], 10) : 0;
    if (hour < 8) hour += 12; // assume pm
    ranges.push([m.index, m.index + m[0].length]);
    return { time: { hour, minute }, ranges };
  }

  return { time: null, ranges: [] };
}

function parseDuration(lower: string): { duration: number; range: [number, number] | null } {
  const re = /for\s+(\d+(?:\.\d+)?)\s*(h(?:our)?s?|min(?:ute)?s?)/gi;
  const m = re.exec(lower);
  if (!m) return { duration: 60, range: null };
  const val = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  const minutes = unit.startsWith('h') ? Math.round(val * 60) : Math.round(val);
  return { duration: minutes, range: [m.index, m.index + m[0].length] };
}

function parseLocation(lower: string, original: string): { location: string | null; range: [number, number] | null } {
  // "@" style
  const reAt = /@\s*([A-Za-z][a-zA-Z\s]{2,20})/g;
  const mAt = reAt.exec(original);
  if (mAt) {
    return { location: mAt[1].trim(), range: [mAt.index, mAt.index + mAt[0].length] };
  }

  // "at CapitalizedPlace"
  const reAtWord = /\bat\s+([A-Z][a-zA-Z\s]{2,20})/g;
  const mAtWord = reAtWord.exec(original);
  if (mAtWord) {
    return { location: mAtWord[1].trim(), range: [mAtWord.index, mAtWord.index + mAtWord[0].length] };
  }

  return { location: null, range: null };
}

function parseDate(lower: string): { date: Date | null; range: [number, number] | null } {
  const today = startOfToday();

  // "today"
  const todayRe = /\btoday\b/;
  const todayM = todayRe.exec(lower);
  if (todayM) {
    return { date: today, range: [todayM.index, todayM.index + todayM[0].length] };
  }

  // "tomorrow"
  const tomRe = /\btomorrow\b/;
  const tomM = tomRe.exec(lower);
  if (tomM) {
    return { date: addDays(today, 1), range: [tomM.index, tomM.index + tomM[0].length] };
  }

  // Weekday names
  const weekdayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i;
  const wdM = weekdayPattern.exec(lower);
  if (wdM) {
    const dayNum = DAY_NAMES[wdM[1].toLowerCase()];
    if (dayNum !== undefined) {
      return { date: nextWeekday(dayNum), range: [wdM.index, wdM.index + wdM[0].length] };
    }
  }

  // Month name + day: "jan 15", "february 3"
  const monthDayRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/i;
  const mdM = monthDayRe.exec(lower);
  if (mdM) {
    const monthNum = MONTH_NAMES[mdM[1].toLowerCase().slice(0, 3)] ?? MONTH_NAMES[mdM[1].toLowerCase()];
    const dayNum = parseInt(mdM[2], 10);
    if (monthNum !== undefined) {
      const year = today.getFullYear();
      const candidate = new Date(year, monthNum, dayNum, 0, 0, 0, 0);
      if (candidate < today) candidate.setFullYear(year + 1);
      return { date: candidate, range: [mdM.index, mdM.index + mdM[0].length] };
    }
  }

  // Numeric M/D or MM/DD
  const numericRe = /\b(\d{1,2})\/(\d{1,2})\b/;
  const numM = numericRe.exec(lower);
  if (numM) {
    const month = parseInt(numM[1], 10) - 1;
    const day = parseInt(numM[2], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const year = today.getFullYear();
      const candidate = new Date(year, month, day, 0, 0, 0, 0);
      if (candidate < today) candidate.setFullYear(year + 1);
      return { date: candidate, range: [numM.index, numM.index + numM[0].length] };
    }
  }

  return { date: null, range: null };
}

function extractTitle(original: string, usedRanges: [number, number][]): string {
  // Sort ranges descending so we can splice from the back
  const sorted = [...usedRanges].sort((a, b) => b[0] - a[0]);
  let result = original;
  for (const [start, end] of sorted) {
    result = result.slice(0, start) + ' ' + result.slice(end);
  }

  // Clean up leftover leading prepositions/conjunctions at word boundaries
  result = result
    .replace(/\b(at|on|for|in|and|with|the|a|an|to|of)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
    .trim();

  return result;
}

function parseLine(line: string, sourceItemId: string, sourceTitle: string, sourceKind: string): ParsedSuggestion | null {
  if (line.length < 8) return null;

  const lower = line.toLowerCase();
  const usedRanges: [number, number][] = [];

  // Parse date
  const { date, range: dateRange } = parseDate(lower);
  if (dateRange) usedRanges.push(dateRange);

  // Parse time
  const { time, ranges: timeRanges } = parseTime(lower, line);
  for (const r of timeRanges) usedRanges.push(r);

  // Only create suggestion if at least one of date or time matched
  if (!date && !time) return null;

  // Parse duration
  const { duration, range: durRange } = parseDuration(lower);
  if (durRange) usedRanges.push(durRange);

  // Parse location
  const { location, range: locRange } = parseLocation(lower, line);
  if (locRange) usedRanges.push(locRange);

  // Extract title
  const rawTitle = extractTitle(line, usedRanges);
  const title = rawTitle.length > 0 ? rawTitle : sourceTitle;

  const id = makeId(sourceItemId, line);

  return {
    id,
    sourceItemId,
    sourceKind,
    sourceTitle,
    evidenceSnippet: line.trim(),
    title,
    date,
    time,
    duration,
    location,
    needsConfirmation: !date && !!time,
    dismissed: false,
  };
}

// ---------------------------------------------------------------------------
// Main parse function
// ---------------------------------------------------------------------------

export function parseSuggestions(items: VFItem[]): ParsedSuggestion[] {
  const results: ParsedSuggestion[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    // Skip vault and archived
    if (item.kind === 'vault') continue;
    if (item.archived) continue;

    // Gather text to scan: title + body + taskData fields
    const textParts: string[] = [item.title, item.body];
    if (item.taskData) {
      textParts.push(
        item.taskData.important,
        item.taskData.tomorrow,
        item.taskData.notes,
        ...item.taskData.tasks.map((t) => t.text),
      );
    }
    const fullText = textParts.filter(Boolean).join('\n');

    // Split into lines by newline and ". "
    const rawLines = fullText.split(/\n|\. /);

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (line.length < 8) continue;

      const suggestion = parseLine(line, item.id, item.title || item.kind, item.kind);
      if (!suggestion) continue;
      if (seenIds.has(suggestion.id)) continue;

      seenIds.add(suggestion.id);
      results.push(suggestion);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Dismissed set persistence
// ---------------------------------------------------------------------------

export async function loadDismissedSet(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw) as string[];
    return new Set<string>(arr);
  } catch {
    return new Set<string>();
  }
}

export async function saveDismissedSet(set: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // swallow persistence errors
  }
}

export async function dismissSuggestion(id: string): Promise<void> {
  const set = await loadDismissedSet();
  set.add(id);
  await saveDismissedSet(set);
}

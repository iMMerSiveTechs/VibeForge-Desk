import type { ItemKind } from '../../constants';
import { KIND_KEYS } from '../../constants';
import type { LlmExtract } from './schema';

/**
 * Attempts to parse raw JSON string and validate it against the LlmExtract schema.
 * Returns a validated LlmExtract or null if parsing/validation fails.
 */
export function safeParseAndValidateLlmJson(
  raw: string,
  fallbackKind: ItemKind,
): LlmExtract | null {
  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) return null;

    const kind: ItemKind = KIND_KEYS.includes(parsed.kind) ? parsed.kind : fallbackKind;
    const title = typeof parsed.title === 'string' ? parsed.title.slice(0, 200) : '';
    const body = typeof parsed.body === 'string' ? parsed.body : '';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 20)
      : [];

    const result: LlmExtract = { kind, title, body, tags };

    // Validate taskData if present and kind is task
    if (kind === 'task' && parsed.taskData && typeof parsed.taskData === 'object') {
      const td = parsed.taskData;
      result.taskData = {
        date: typeof td.date === 'string' ? td.date : new Date().toISOString().slice(0, 10),
        tasks: Array.isArray(td.tasks)
          ? td.tasks
              .filter((t: unknown) => typeof t === 'object' && t !== null)
              .map((t: Record<string, unknown>) => ({
                text: typeof t.text === 'string' ? t.text : '',
                done: typeof t.done === 'boolean' ? t.done : false,
              }))
              .slice(0, 50)
          : [],
        important: typeof td.important === 'string' ? td.important : '',
        tomorrow: typeof td.tomorrow === 'string' ? td.tomorrow : '',
        gratitude: typeof td.gratitude === 'string' ? td.gratitude : '',
        notes: typeof td.notes === 'string' ? td.notes : '',
      };
    }

    return result;
  } catch {
    return null;
  }
}
